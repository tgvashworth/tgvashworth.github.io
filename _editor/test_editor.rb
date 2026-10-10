# frozen_string_literal: true

require "minitest/autorun"
require "tmpdir"
require_relative "server"

class EditorTest < Minitest::Test
  def setup
    @previous_directory = Dir.pwd
    @temporary = Dir.mktmpdir("jekyll-editor-test-")
    @root = File.join(@temporary, "site")
    FileUtils.mkdir_p([File.join(@root, "_posts"), File.join(@root, "_layouts")])
    File.write(File.join(@root, "_config.yml"), "title: Test site\nmarkdown: kramdown\n")
    File.write(File.join(@root, "_layouts/post.html"), "<!doctype html><html><body><h1>{{ page.title }}</h1><article>{{ content }}</article></body></html>")
    Dir.chdir(@root)
    @workspace = LocalEditor::Workspace.new(@root)
  end

  def teardown
    Dir.chdir(@previous_directory)
    Jekyll.sites.delete(@workspace.site) if @workspace
    FileUtils.remove_entry(@temporary)
  end

  def input(**changes)
    { "title" => "A thought", "summary" => "A small summary", "frontmatter" => "layout: post", "body" => "\nA **small** thought.\n", "date" => Date.today.iso8601 }.merge(changes.transform_keys(&:to_s))
  end

  def command(*args)
    output, status = Open3.capture2e(*args)
    assert status.success?, output
    output.strip
  end

  def repository
    command("git", "init", "-b", "main", @root)
    @workspace.git("config", "user.email", "editor@example.test")
    @workspace.git("config", "user.name", "Editor Test")
    @workspace.git("config", "commit.gpgSign", "false")
    @workspace.git("config", "core.hooksPath", File.join(@root, ".git", "hooks"))
    File.write(File.join(@root, ".gitignore"), ".jekyll-editor/\n")
    @workspace.git("add", ".")
    @workspace.git("commit", "-m", "Initial fixture")
    @remote = File.join(@temporary, "remote.git")
    command("git", "init", "--bare", @remote)
    @workspace.git("remote", "add", "origin", @remote)
    @workspace.git("push", "origin", "main")
  end

  def test_new_post_is_saved_as_a_draft_with_collision_safe_names
    first = @workspace.save(input)
    second = @workspace.save(input)
    assert_equal "_drafts/a-thought.md", first[:id]
    assert_equal "_drafts/a-thought-2.md", second[:id]
    assert first[:draft]
    assert_equal input["body"], first[:body]
    assert_equal 2, @workspace.list.length
  end

  def test_save_preserves_unknown_metadata_and_comments
    metadata = "layout: post\ntitle: Old title\nsummary: |\n  A long\n  summary\n# Keep this comment\ntags:\n  - ruby\n  - jekyll\ncustom:\n  nested: true\ndate: 2020-02-03 10:20:00 +0000"
    id = "_posts/2020-02-03-original.md"
    File.write(@workspace.path(id), "---\n#{metadata}\n---\nBody\n")
    old = @workspace.read(id)
    saved = @workspace.save(old.transform_keys(&:to_s).merge("title" => 'A "quoted" title', "summary" => "Short summary"))
    assert_equal 'A "quoted" title', saved[:title]
    assert_equal "Short summary", saved[:summary]
    assert_includes saved[:frontmatter], "# Keep this comment\ntags:\n  - ruby\n  - jekyll\ncustom:\n  nested: true\ndate: 2020-02-03 10:20:00 +0000"
    assert_equal id, saved[:id]
    assert_equal "2020-02-03", saved[:date]
  end

  def test_noop_save_preserves_frontmatter_verbatim
    post = @workspace.save(input(frontmatter: "layout: post\ntitle: A thought # a comment\nsummary: A small summary\n# Footer comment"))
    source = File.read(@workspace.path(post[:id]))
    @workspace.save(post.transform_keys(&:to_s))
    assert_equal source, File.read(@workspace.path(post[:id]))
  end

  def test_conflict_does_not_overwrite_external_changes
    post = @workspace.save(input)
    target = @workspace.path(post[:id])
    File.write(target, File.read(target) + "Outside edit\n")
    error = assert_raises(LocalEditor::Error) { @workspace.save(post.transform_keys(&:to_s)) }
    assert_equal 409, error.status
    assert_includes File.read(target), "Outside edit"
  end

  def test_small_note_survives_save_reopen_and_can_be_disabled
    post = @workspace.save(input(note: true, frontmatter: "layout: post\n# Keep this\ntags: [writing]"))
    assert @workspace.read(post[:id])[:note]
    assert_includes post[:frontmatter], "note: true"
    updated = @workspace.save(post.transform_keys(&:to_s).merge("title" => "An updated note"))
    assert updated[:note]
    ordinary = @workspace.save(updated.transform_keys(&:to_s).merge("note" => false))
    refute ordinary[:note]
    assert_includes ordinary[:frontmatter], "# Keep this\ntags: [writing]"
    assert_raises(LocalEditor::Error) { @workspace.save(input(note: "true")) }
  end

  def test_homepage_renders_notes_in_full_with_linked_title_and_keeps_post_summaries
    project = File.expand_path("..", __dir__)
    FileUtils.cp(File.join(project, "index.html"), @root)
    FileUtils.cp(Dir.glob(File.join(project, "_layouts", "*.html")), File.join(@root, "_layouts"))
    File.write(File.join(@root, "_config.yml"), "baseurl: /blog\nmarkdown: kramdown\n")
    File.write(@workspace.path("_posts/2020-01-03-note.md"), "---\nlayout: post\ntitle: Small & useful\nnote: true\n---\nA **complete** note.\n\n- One\n- Two\n")
    File.write(@workspace.path("_posts/2020-01-02-essay.md"), "---\nlayout: post\ntitle: An essay\nsummary: Essay summary\n---\nEssay body stays on its own page.\n")
    File.write(@workspace.path("_posts/2020-01-01-ordinary.md"), "---\nlayout: post\ntitle: Ordinary\nnote: false\n---\nOrdinary body stays on its own page.\n")
    @workspace.rebuild
    require "nokogiri"
    home = Nokogiri::HTML(File.read(File.join(@workspace.destination, "index.html")))
    entries = home.css(".post-list > .post-list-item")
    assert_equal 3, entries.length
    note = entries.first
    assert_equal "Small & useful", note.at_css("a.post-link.note-title").text
    assert_equal "complete", note.at_css(".note-body strong").text
    assert_equal ["One", "Two"], note.css(".note-body li").map(&:text)
    assert_equal "/blog/2020/01/03/note.html", note.at_css("a.note-title")['href']
    assert_equal "03 Jan 2020", note.at_css(".date").text
    assert_equal entries[1].at_css(".date")['class'], note.at_css(".date")['class']
    assert_equal ["span", "a"], note.element_children.first(2).map(&:name)
    assert_equal ["span", "a"], entries[1].element_children.first(2).map(&:name)
    assert_equal "Essay summary", entries[1].at_css(".summary").text
    refute_includes home.text, "Essay body stays"
    refute_includes home.text, "Ordinary body stays"
    page = Nokogiri::HTML(File.read(File.join(@workspace.destination, "2020/01/03/note.html")))
    assert_equal "Small & useful", page.at_css(".post-header-note .post-title").text
    assert_equal "complete", page.at_css(".post strong").text
    draft = @workspace.save(input(note: true))
    @workspace.rebuild
    document = @workspace.site.posts.docs.find { |post| post.relative_path == draft[:id] }
    draft_page = Nokogiri::HTML(File.read(document.destination(@workspace.destination)))
    assert_includes draft_page.at_css(".post-eyebrow").text, "#{Date.today.day} #{Date.today.strftime('%B %Y')}"
    refute_includes draft_page.text, "years old"
  end

  def test_removed_file_is_not_recreated_by_stale_editor
    post = @workspace.save(input)
    File.delete(@workspace.path(post[:id]))
    assert_raises(LocalEditor::Error) { @workspace.save(post.transform_keys(&:to_s)) }
    refute File.exist?(@workspace.path(post[:id]))
  end

  def test_paths_cannot_escape_content_directories
    ["../README.md", "_posts/../README.md", "_posts/nested/post.md", "_posts/.hidden.md", "_posts/new\nline.md", "_posts/evil.rb", nil].each do |id|
      assert_raises(LocalEditor::Error) { @workspace.path(id) }
    end
    File.symlink(File.join(@root, "_config.yml"), File.join(@root, "_posts", "escape.md"))
    assert_raises(LocalEditor::Error) { @workspace.read("_posts/escape.md") }
    File.symlink(@temporary, File.join(@root, "_drafts"))
    assert_raises(LocalEditor::Error) { @workspace.save(input) }
  end

  def test_bad_yaml_and_blank_title_do_not_write_files
    assert_raises(LocalEditor::Error) { @workspace.save(input(frontmatter: "layout: [oops")) }
    assert_raises(LocalEditor::Error) { @workspace.save(input(title: " ")) }
    assert_raises(LocalEditor::Error) { @workspace.save(input(title: { "value" => "text" })) }
    assert_empty @workspace.list
  end

  def test_preview_uses_jekyll_layout_liquid_and_markdown_without_saving
    html = @workspace.preview(input(title: "Preview title", body: "{{ site.title }} **Markdown**\n\n```ruby\nputs 'hello'\n```\n"))
    assert_includes html, "<h1>Preview title</h1>"
    assert_includes html, "Test site <strong>Markdown</strong>"
    assert_includes html, "language-ruby"
    assert_empty @workspace.list
    assert_empty Dir.glob(File.join(@root, "_posts", "*.md"))
  end

  def test_preview_refreshes_title_and_body_each_time
    @workspace.preview(input(title: "First", body: "First body"))
    html = @workspace.preview(input(title: "Second", body: "Second body"))
    assert_includes html, "<h1>Second</h1>"
    assert_includes html, "Second body"
    refute_includes html, "First body"
  end

  def test_ship_untracked_draft_commits_only_the_post
    repository
    File.write(File.join(@root, "unrelated.txt"), "Leave me alone")
    draft = @workspace.save(input)
    result = @workspace.ship(draft.transform_keys(&:to_s))
    assert result[:shipped]
    assert_match %r{\A_posts/\d{4}-\d{2}-\d{2}-a-thought.md\z}, result[:post][:id]
    refute File.exist?(@workspace.path(draft[:id]))
    assert_equal result[:post][:id], @workspace.git("show", "--pretty=", "--name-only", "HEAD")
    assert_equal result[:commit], command("git", "--git-dir", @remote, "rev-parse", "main")
    assert_equal "?? unrelated.txt", @workspace.git("status", "--short")
  end

  def test_ship_tracked_draft_records_rename
    draft = @workspace.save(input)
    repository
    result = @workspace.ship(draft.transform_keys(&:to_s))
    names = @workspace.git("show", "--pretty=", "--name-only", "--no-renames", "HEAD")
    assert_includes names, draft[:id]
    assert_includes names, result[:post][:id]
    assert result[:shipped]
  end

  def test_ship_blocks_other_branches_staged_changes_and_ahead_commits
    repository
    draft = @workspace.save(input)
    @workspace.git("checkout", "-b", "codex/test")
    assert_raises(LocalEditor::Error) { @workspace.ship(draft.transform_keys(&:to_s)) }
    @workspace.git("checkout", "main")
    File.write(File.join(@root, "other.txt"), "Other work")
    @workspace.git("add", "other.txt")
    assert_raises(LocalEditor::Error) { @workspace.ship(draft.transform_keys(&:to_s)) }
    @workspace.git("commit", "-m", "Other work")
    assert_raises(LocalEditor::Error) { @workspace.ship(draft.transform_keys(&:to_s)) }
    assert File.exist?(@workspace.path(draft[:id]))
  end

  def test_failed_build_restores_draft_before_committing
    repository
    draft = @workspace.save(input(body: "{% unknown_tag %}"))
    original_head = @workspace.git("rev-parse", "HEAD")
    assert_raises(Liquid::SyntaxError) { @workspace.ship(draft.transform_keys(&:to_s)) }
    assert_equal draft[:body], @workspace.read(draft[:id])[:body]
    assert_equal original_head, @workspace.git("rev-parse", "HEAD")
    assert_empty @workspace.git("diff", "--cached", "--name-only")
    assert_empty Dir.glob(File.join(@root, "_posts", "*.md"))
  end

  def test_push_failure_can_be_retried_without_another_commit
    repository
    hook = File.join(@remote, "hooks", "pre-receive")
    File.write(hook, "#!/bin/sh\nexit 1\n")
    File.chmod(0o755, hook)
    draft = @workspace.save(input)
    error = assert_raises(LocalEditor::Error) { @workspace.ship(draft.transform_keys(&:to_s)) }
    assert_includes error.message, "Committed locally"
    head = @workspace.git("rev-parse", "HEAD")
    post = @workspace.list.find { |entry| entry[:id].start_with?("_posts/") }
    File.delete(hook)
    result = @workspace.ship(@workspace.read(post[:id]).transform_keys(&:to_s))
    assert result[:shipped]
    assert_equal head, result[:commit]
    assert_equal head, command("git", "--git-dir", @remote, "rev-parse", "main")
    refute File.exist?(File.join(@root, ".jekyll-editor", "pending-ship.json"))
  end

  def test_failed_commit_restores_draft_and_clears_its_staged_paths
    repository
    hook = File.join(@root, ".git", "hooks", "pre-commit")
    File.write(hook, "#!/bin/sh\nexit 1\n")
    File.chmod(0o755, hook)
    draft = @workspace.save(input)
    original_head = @workspace.git("rev-parse", "HEAD")
    assert_raises(LocalEditor::Error) { @workspace.ship(draft.transform_keys(&:to_s)) }
    assert_equal draft[:revision], @workspace.read(draft[:id])[:revision]
    assert_equal original_head, @workspace.git("rev-parse", "HEAD")
    assert_empty @workspace.git("diff", "--cached", "--name-only")
    assert_empty Dir.glob(File.join(@root, "_posts", "*.md"))
  end

  def test_ship_existing_post_keeps_unrelated_tracked_edits_out_of_commit
    id = "_posts/2020-02-03-original.md"
    File.write(@workspace.path(id), "---\nlayout: post\ntitle: Original\n---\nOld body\n")
    repository
    File.write(File.join(@root, "_config.yml"), "title: Unrelated change\n")
    post = @workspace.read(id)
    saved = @workspace.save(post.transform_keys(&:to_s).merge("body" => "Updated body\n"))
    result = @workspace.ship(saved.transform_keys(&:to_s))
    assert result[:shipped]
    assert_equal id, @workspace.git("show", "--pretty=", "--name-only", "HEAD")
    assert_equal "M _config.yml", @workspace.git("status", "--short")
  end

  def test_api_rejects_nonlocal_hosts_missing_tokens_and_cross_origin_writes
    server = LocalEditor::Server.allocate
    server.instance_variable_set(:@port, 4011)
    server.instance_variable_set(:@token, "test-token")
    request_type = Struct.new(:path, :request_method, :body, :headers) do
      def [](key) = headers[key]
    end
    [
      ["attacker.test:4011", "test-token", "http://attacker.test:4011", "GET", 403],
      ["127.0.0.1:4011", nil, nil, "GET", 403],
      ["127.0.0.1:4011", "test-token", "https://attacker.test", "POST", 403],
      ["127.0.0.1:4011", "test-token", "http://127.0.0.1:4011", "POST", 400]
    ].each do |host, token, origin, method, expected|
      response = WEBrick::HTTPResponse.new(WEBrick::Config::HTTP)
      request = request_type.new("/editor/api/save", method, "{}", { "host" => host, "x-editor-token" => token, "origin" => origin })
      server.route(request, response)
      assert_equal expected, response.status
    end
  end

  def test_writing_checks_keep_offsets_and_ignore_code
    text = "This is very very easy.\n\n```ruby\nvery very\n```\n"
    output, status = Open3.capture2e("node", File.join(__dir__, "check.cjs"), stdin_data: text)
    assert status.success?, output
    suggestions = JSON.parse(output)
    assert suggestions.any? { |suggestion| suggestion["reason"].include?("repeated") }
    suggestions.each do |suggestion|
      assert_equal 1, suggestion["line"]
      assert_equal suggestion["excerpt"], text[suggestion["index"], suggestion["offset"]]
    end
  end
end
