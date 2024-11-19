(() => {
    'use strict';

    // Application State
    const state = {
        isRunning: false,
        isWorkTime: true,
        workDuration: 25 * 60,
        breakDuration: 5 * 60,
        timeRemaining: 25 * 60,
        timerId: null,
        message: '',
        messageTimerId: null,
        messageTime: 5000,
        messageHighlight: false
    };

    // DOM Elements
    const startButton = document.getElementById('start');
    const resetButton = document.getElementById('reset');
    const switchModeButton = document.getElementById('switch-mode');
    const timerDisplay = document.getElementById('timer');
    const messageDisplay = document.getElementById('message');
    const header = document.querySelector('h1');

    // Initialize
    const init = () => {
        state.timeRemaining = state.workDuration;
        bindEvents();
        requestAnimationFrame(updateUI);
        requestNotificationPermission();
    };

    // Bind Event Listeners
    const bindEvents = () => {
        startButton.addEventListener('click', toggleTimer);
        resetButton.addEventListener('click', resetTimer);
        switchModeButton.addEventListener('click', switchMode);
    };

    // Request Notification Permission
    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.', Notification.permission);
                } else if (permission === 'denied') {
                    console.log('Notification permission denied.', Notification.permission);
                }
            });
        }
    };

    // Update UI
    const updateUI = () => {
        const minutes = Math.floor(state.timeRemaining / 60);
        const seconds = String(state.timeRemaining % 60).padStart(2, '0');
        const timeString = `${minutes}:${seconds}`;
        const modeString = state.isWorkTime ? 'Work' : 'Break';

        timerDisplay.textContent = timeString;
        document.title = `${timeString} | ${modeString} | Pomodoro Timer`;
        startButton.textContent = state.isRunning ? 'Pause' : 'Start';
        messageDisplay.textContent = state.message;
        messageDisplay.classList.toggle('item-highlight', state.messageHighlight);

        // Update the <h1> to indicate the current mode
        header.textContent = modeString;

        // Change background based on state
        document.body.dataset.mode = state.isWorkTime ? 'work' : 'break';
    };

    // Update State
    const updateState = () => {
        if (!state.isRunning) return;

        state.timeRemaining -= 1;

        if (state.timeRemaining < 0) {
            state.isWorkTime = !state.isWorkTime;
            state.timeRemaining = state.isWorkTime
                ? state.workDuration
                : state.breakDuration;
            state.message = state.isWorkTime ? 'Back to work!' : 'Time for a break!';
            state.messageHighlight = true;
            sendNotification('Pomodoro Timer', state.message);
            // Clear the message after a few seconds
            state.messageTimerId = setTimeout(() => {
                state.messageTimerId = null;
                requestAnimationFrame(updateUI);
            }, state.messageTime);
        } else {
            if (state.messageTimerId == null) {
                state.message = '';
                state.messageHighlight = false;
            }
        }

        requestAnimationFrame(updateUI);
    };

    // Toggle Timer
    const toggleTimer = () => {
        state.isRunning = !state.isRunning;

        if (state.isRunning) {
            state.timerId = setInterval(updateState, 1000);
        } else {
            clearInterval(state.timerId);
        }

        requestAnimationFrame(updateUI);
    };

    // Reset Timer
    const resetTimer = () => {
        state.isRunning = false;
        clearInterval(state.timerId);
        state.isWorkTime = true;
        state.timeRemaining = state.workDuration;
        state.message = '';
        requestAnimationFrame(updateUI);
    };

    // Switch Mode Function
    const switchMode = () => {
        state.isWorkTime = !state.isWorkTime;
        state.timeRemaining = state.isWorkTime
            ? state.workDuration
            : state.breakDuration;
        state.message = '';
        requestAnimationFrame(updateUI);
    };

    // Send Notification
    const sendNotification = (title, body) => {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            });
        }
    };

    // Start the App
    init();
})();