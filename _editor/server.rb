# frozen_string_literal: true

require "jekyll"
require "webrick"
require "json"
require "digest"
require "securerandom"
require "fileutils"
require "open3"
require "timeout"
require "cgi"

module LocalEditor
  # Jekyll assigns undated drafts their file time lazily. Set it before sorting
  # and rendering so the local post page and homepage use the same date.
  Jekyll::Hooks.register :site, :post_read do |site|
    site.posts.docs.each(&:date)
    site.posts.docs.sort!
  end

  class Error < StandardError
    attr_reader :status
    def initialize(message, status = 400)
      super(message)
      @status = status
    end
  end

  class Workspace
    attr_reader :root, :site, :destination

    def initialize(root)
      @root = File.realpath(root)
      @destination = File.join(@root, ".jekyll-editor", "site")
      @mutex = Mutex.new
      rebuild
    end

    def synchronize(&block)
      @mutex.synchronize(&block)
    end

    def rebuild
      config = Jekyll.configuration(
        "source" => root, "destination" => destination,
        "show_drafts" => true, "unpublished" => true, "future" => true,
        "strict_front_matter" => true, "quiet" => true
      )
      config["exclude"] += [".worktrees", ".jekyll-editor", "_editor"]
      if @site
        @site.config = config
      else
        @site = Jekyll::Site.new(config)
      end
      @site.process
    end

    # Only top-level Markdown posts/drafts are writable. Check directory and
    # file symlinks too: a valid-looking path must never escape the checkout.
    def path(id)
      raise Error, "Choose a Markdown post or draft." unless id.is_a?(String) &&
        id.match?(%r{\A_(?:posts|drafts)/[^/\\\x00\r\n]+\.(?:md|markdown)\z}) &&
        !File.basename(id).start_with?(".")
      directory = File.join(root, File.dirname(id))
      if File.exist?(directory) || File.symlink?(directory)
        raise Error, "Content directories cannot be symlinks." if File.symlink?(directory)
        raise Error, "Content directory is outside this checkout." unless File.realpath(directory).start_with?(root + "/")
      end
      target = File.join(root, id)
      raise Error, "Content files cannot be symlinks." if File.symlink?(target)
      target
    end

    def split(source)
      match = source.match(/\A---\r?\n(.*?)\r?\n(?:---|\.\.\.)\r?\n?(.*)\z/m)
      raise Error, "This file needs valid YAML front matter." unless match
      metadata = YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: false) || {}
      raise Error, "Front matter must be a mapping." unless metadata.is_a?(Hash)
      [match[1], match[2], metadata]
    rescue Psych::Exception => e
      raise Error, "Invalid front matter: #{e.message}"
    end

    def read(id)
      target = path(id)
      raise Error.new("That post no longer exists.", 404) unless File.file?(target)
      source = File.read(target, encoding: "UTF-8")
      header, body, metadata = split(source)
      date = metadata["date"] || id[/\d{4}-\d{1,2}-\d{1,2}/] || File.mtime(target).to_date
      {
        id: id, title: metadata["title"].to_s, summary: metadata["summary"].to_s,
        date: Date.parse(date.to_s).iso8601, body: body, frontmatter: header,
        revision: Digest::SHA256.hexdigest(source), draft: id.start_with?("_drafts/") || metadata["published"] == false,
        note: metadata["note"] == true
      }
    end

    def list
      Dir.glob(File.join(root, "{_posts,_drafts}", "*.{md,markdown}")).filter_map do |target|
        id = target.delete_prefix(root + "/")
        begin
          read(id).reject { |key, _| %i[body frontmatter revision].include?(key) }
        rescue Error, ArgumentError
          { id: id, title: File.basename(id), date: "", draft: id.start_with?("_drafts/"), invalid: true }
        end
      end.sort_by { |post| [post[:date], post[:id]] }.reverse
    end

    def scalar(header, key, value)
      lines = header.lines
      index = lines.index { |line| line.match?(/^#{Regexp.escape(key)}:/) }
      replacement = "#{key}: #{JSON.generate(value)}\n"
      if index
        finish = index + 1
        # Remove continuations of the field being changed, keeping unrelated
        # metadata and comments exactly as written.
        finish += 1 while finish < lines.length && (lines[finish].match?(/^[ \t]+/) || lines[finish].strip.empty?)
        lines[index...finish] = [replacement]
      else
        lines[-1] += "\n" if lines.any? && !lines[-1].end_with?("\n")
        lines << replacement
      end
      lines.join.chomp
    end

    def source_for(input)
      raise Error, "Title must be text." unless input["title"].is_a?(String)
      raise Error, "Summary must be text." unless input["summary"].nil? || input["summary"].is_a?(String)
      raise Error, "Front matter must be YAML text." unless input["frontmatter"].is_a?(String)
      raise Error, "Give your post a title." if input["title"].to_s.strip.empty?
      raise Error, "Post text must be a string." unless input["body"].is_a?(String)
      header = input["frontmatter"].to_s
      _, _, old = split("---\n#{header}\n---\n")
      header = scalar(header, "title", input["title"]) unless old["title"] == input["title"]
      header = scalar(header, "summary", input["summary"].to_s) unless old["summary"].to_s == input["summary"].to_s
      if input.key?("note")
        raise Error, "Small note must be true or false." unless [true, false].include?(input["note"])
        header = scalar(header, "note", input["note"]) unless (old["note"] == true) == input["note"]
      end
      header = scalar(header, "layout", "post") unless old["layout"]
      source = "---\n#{header}\n---\n#{input['body']}"
      split(source)
      source
    end

    def new_id(title, draft: true, date: Date.today.iso8601)
      slug = title.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "")
      slug = "untitled" if slug.empty?
      base = draft ? "_drafts/#{slug}" : "_posts/#{date}-#{slug}"
      id = "#{base}.md"
      suffix = 2
      while File.exist?(path(id))
        id = "#{base}-#{suffix}.md"
        suffix += 1
      end
      id
    end

    def save(input)
      source = source_for(input)
      id = input["id"] || new_id(input["title"])
      target = path(id)
      if File.exist?(target)
        current = Digest::SHA256.hexdigest(File.binread(target))
        raise Error.new("This file changed outside the editor. Copy your text, then reopen it before saving.", 409) unless current == input["revision"]
      elsif input["id"]
        raise Error.new("This file was moved or removed. Copy your text before reopening it.", 409)
      end
      atomic_write(target, source)
      read(id)
    end

    def atomic_write(target, source)
      FileUtils.mkdir_p(File.dirname(target))
      temporary = "#{target}.#{SecureRandom.hex(8)}.tmp"
      begin
        File.open(temporary, File::WRONLY | File::CREAT | File::EXCL, File.exist?(target) ? File.stat(target).mode & 0o777 : 0o644) do |file|
          file.write(source)
          file.flush
          file.fsync
        end
        File.rename(temporary, target)
      ensure
        File.delete(temporary) if File.exist?(temporary)
      end
    end

    def preview(input)
      source = source_for(input)
      _, body, metadata = split(source)
      id = input["id"] || "_posts/#{Date.today.iso8601}-preview.md"
      document = Jekyll::Document.new(path(id), site: site, collection: site.posts)
      document.content = body
      document.merge_data!(metadata)
      document.data["date"] ||= Time.parse(input["date"].to_s.empty? ? Date.today.iso8601 : input["date"])
      document.data["slug"] ||= File.basename(id, ".*").sub(/\A\d{4}-\d{1,2}-\d{1,2}-/, "")
      document.data["title"] = metadata["title"]
      # A preview must not join site.posts or write a temporary post to disk.
      Jekyll::Renderer.new(site, document, site.site_payload).run
    end

    def git(*args)
      output = nil
      status = nil
      Timeout.timeout(45) { output, status = Open3.capture2e("git", "-C", root, *args) }
      raise Error.new(output.strip.empty? ? "Git command failed." : output.strip, 422) unless status.success?
      output.strip
    rescue Timeout::Error
      raise Error.new("Git timed out. Check the repository before retrying.", 504)
    end

    def shipping_status
      branch = git("branch", "--show-current")
      return { branch: branch, available: false, reason: "Shipping is available from a writing checkout on main. Saving and previewing work on this branch." } unless branch == "main"
      return { branch: branch, available: false, reason: "Clear the staged changes before shipping a post." } unless git("diff", "--cached", "--name-only").empty?
      git("remote", "get-url", "origin")
      { branch: branch, available: true }
    rescue Error => e
      { available: false, reason: e.message }
    end

    def ship(input)
      status = shipping_status
      raise Error.new(status[:reason], 409) unless status[:available]
      raise Error, "Save the post before shipping." unless input["id"]
      post = read(input["id"])
      raise Error.new("The saved post changed. Reopen it before shipping.", 409) unless post[:revision] == input["revision"]
      raise Error, "Give your post a title." if post[:title].strip.empty?
      # Do not push unrelated local commits or merge remote changes silently.
      git("fetch", "origin", "main")
      remote_head = git("rev-parse", "FETCH_HEAD")
      local_head = git("rev-parse", "HEAD")
      retry_file = File.join(root, ".jekyll-editor", "pending-ship.json")
      pending = File.exist?(retry_file) ? JSON.parse(File.read(retry_file)) : nil
      if pending
        raise Error.new("A previous publish commit needs pushing first. Retry from its unchanged post, or resolve it in Git.", 409) unless pending["commit"] == local_head && pending["id"] == post[:id] && pending["revision"] == post[:revision]
        git("push", "origin", "HEAD:refs/heads/main")
        File.delete(retry_file)
        return { post: post, commit: local_head, shipped: true }
      end
      raise Error.new("This checkout differs from origin/main. Sync it in Git before shipping; the editor won't merge or push other commits.", 409) unless local_head == remote_head

      old_id = post[:id]
      new_id = old_id
      original = File.binread(path(old_id))
      paths = []
      begin
        if old_id.start_with?("_drafts/")
          new_id = new_id(post[:title], draft: false, date: Date.today.iso8601)
          header, body, metadata = split(original)
          header = scalar(header, "published", true) if metadata["published"] == false
          header = scalar(header, "draft", false) if metadata["draft"] == true
          # Keep the draft until the post has been written successfully.
          atomic_write(path(new_id), "---\n#{header}\n---\n#{body}")
          File.delete(path(old_id))
        elsif post[:draft]
          header, body, = split(original)
          atomic_write(path(old_id), "---\n#{scalar(header, 'published', true)}\n---\n#{body}")
        end
        paths = [new_id]
        paths << old_id if old_id != new_id && !git("ls-files", "--", old_id).empty?
        # Validate the entire Jekyll site before committing or pushing.
        rebuild
        git("add", "--", *paths)
        if git("diff", "--cached", "--name-only").empty?
          return { post: read(new_id), shipped: false, message: "This post has no unpublished changes." }
        end
        git("commit", "--only", "-m", "post: #{post[:title]}", "--", *paths)
      rescue StandardError
        # A failed build or commit must leave the saved draft intact. Only our
        # own paths can be staged because shipping required an empty index.
        git("reset", "--", *paths) unless paths.empty?
        atomic_write(path(old_id), original)
        File.delete(path(new_id)) if new_id != old_id && File.exist?(path(new_id))
        raise
      end
      commit = git("rev-parse", "HEAD")
      saved = read(new_id)
      File.write(retry_file, JSON.generate({ commit: commit, id: new_id, revision: saved[:revision] }))
      begin
        git("push", "origin", "HEAD:refs/heads/main")
      rescue Error => e
        raise Error.new("Committed locally as #{commit[0, 8]}, but push failed. Reopen #{new_id} and retry Ship. #{e.message}", 422)
      end
      File.delete(retry_file)
      { post: saved, commit: commit, shipped: true }
    end
  end

  class Server
    def initialize(workspace, port)
      @workspace = workspace
      @token = SecureRandom.hex(32)
      @port = port
      @server = WEBrick::HTTPServer.new(BindAddress: "127.0.0.1", Port: port,
        AccessLog: [], Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
        MaxClients: 12, RequestTimeout: 15)
      @server.mount_proc("/") { |request, response| route(request, response) }
    end

    def start
      # The watcher uses the same lock as preview/save to protect Jekyll's
      # mutable renderer. Configuration changes are picked up on rebuild.
      require "listen"
      @listener = Listen.to(@workspace.root, ignore: [%r{^\.}, %r{^node_modules/}, %r{^_site/}, %r{^_editor/}]) do
        @workspace.synchronize { @workspace.rebuild }
      rescue StandardError => e
        warn "Jekyll rebuild failed: #{e.message}"
      end
      @listener.start
      trap("INT") { @server.shutdown }
      trap("TERM") { @server.shutdown }
      puts "Write locally: http://127.0.0.1:#{@port}/editor"
      puts "Site preview: http://127.0.0.1:#{@port}/"
      puts "Checkout: #{@workspace.root}"
      $stdout.flush
      @server.start
    ensure
      @listener&.stop
    end

    def json(response, value)
      response["Content-Type"] = "application/json; charset=utf-8"
      response.body = JSON.generate(value)
    end

    def route(request, response)
      response["Cache-Control"] = "no-store"
      response["X-Content-Type-Options"] = "nosniff"
      response["Referrer-Policy"] = "same-origin"
      host = request["host"].to_s
      raise Error.new("Use the local editor address.", 403) unless ["127.0.0.1:#{@port}", "localhost:#{@port}"].include?(host)
      if request.path.start_with?("/editor/api/")
        raise Error.new("Reload the editor to reconnect.", 403) unless request["x-editor-token"] == @token
        if request.request_method == "POST"
          raise Error.new("Requests must come from this editor.", 403) unless request["origin"] == "http://#{host}"
          raise Error, "Send JSON from the editor." unless request["content-type"].to_s.start_with?("application/json")
          raise Error.new("Post exceeds the 2 MB editor limit.", 413) if request.body.to_s.bytesize > 2 * 1024 * 1024
          input = JSON.parse(request.body.to_s)
          raise Error, "Send a JSON object." unless input.is_a?(Hash)
        end
        @workspace.synchronize { api(request, response, input) }
      elsif %w[GET HEAD].include?(request.request_method)
        @workspace.synchronize { serve(request, response) }
      else
        raise Error.new("Method not allowed.", 405)
      end
    rescue Error => e
      response.status = e.status
      json(response, error: e.message)
    rescue JSON::ParserError
      response.status = 400
      json(response, error: "Invalid JSON.")
    rescue StandardError => e
      warn "#{e.class}: #{e.message}"
      response.status = 500
      json(response, error: e.message)
    end

    def api(request, response, input)
      key = [request.request_method, request.path]
      case key
      when ["GET", "/editor/api/posts"]
        json(response, posts: @workspace.list, shipping: @workspace.shipping_status)
      when ["GET", "/editor/api/post"]
        json(response, @workspace.read(request.query["id"]))
      when ["POST", "/editor/api/save"]
        json(response, @workspace.save(input))
      when ["POST", "/editor/api/preview"]
        json(response, html: @workspace.preview(input))
      when ["POST", "/editor/api/check"]
        output, status = Open3.capture2e("node", File.join(__dir__, "check.cjs"), stdin_data: input["body"].to_s)
        raise Error.new("Writing checks need npm install. #{output.strip}", 503) unless status.success?
        json(response, suggestions: JSON.parse(output))
      when ["POST", "/editor/api/ship"]
        json(response, @workspace.ship(input))
      else
        raise Error.new("Unknown editor endpoint.", 404)
      end
    end

    def serve(request, response)
      if ["/editor", "/editor/"].include?(request.path)
        response["Content-Type"] = "text/html; charset=utf-8"
        response["Content-Security-Policy"] = "default-src 'self'; style-src 'self' 'unsafe-inline' https://use.typekit.net https://p.typekit.net; font-src 'self' https://use.typekit.net data:; script-src 'self'; frame-src 'self'; img-src 'self' data: https:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
        response.body = File.read(File.join(__dir__, "index.html")).sub("EDITOR_TOKEN", @token)
        return
      end
      if %w[/editor/editor.bundle.js /editor/editor.css].include?(request.path)
        target = File.join(__dir__, File.basename(request.path))
      else
        relative = request.path.delete_prefix("/")
        target = File.expand_path(relative, @workspace.destination)
        target = File.join(target, "index.html") if File.directory?(target)
        raise Error.new("Page not found.", 404) unless target.start_with?(@workspace.destination + "/") && File.file?(target) && File.realpath(target).start_with?(@workspace.destination + "/")
      end
      response["Content-Type"] = WEBrick::HTTPUtils.mime_type(target, WEBrick::HTTPUtils::DefaultMimeTypes)
      # Keep analytics and other third-party scripts off the privileged local
      # origin. The site's own theme and contents scripts still work.
      response["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://use.typekit.net https://p.typekit.net; font-src 'self' https://use.typekit.net data:; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self'" if File.extname(target) == ".html"
      response.body = File.binread(target)
      if File.extname(target) == ".html" && !request.path.start_with?("/editor/")
        document = @workspace.site.posts.docs.find { |post| post.destination(@workspace.destination) == target }
        link = document ? "/editor?post=#{CGI.escape(document.relative_path)}" : "/editor"
        label = document ? "Edit this post" : "Write a post"
        response.body = response.body.sub("</body>", "<a href=\"#{link}\" style=\"position:fixed;bottom:20px;right:20px;padding:10px 18px;border-radius:30px;background:#1f2a28;color:#f8f7f1;font:14px system-ui;z-index:10000;text-decoration:none\">#{label}</a></body>")
      end
    end
  end
end

if $PROGRAM_NAME == __FILE__
  root = File.expand_path("..", __dir__)
  port = Integer(ENV.fetch("EDITOR_PORT", "4001"))
  LocalEditor::Server.new(LocalEditor::Workspace.new(root), port).start
end
