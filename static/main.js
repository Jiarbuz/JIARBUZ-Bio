function disableButton(button, duration = 500) {
    if (button.classList.contains('button-disabled')) return;
    button.classList.add('button-disabled');
    setTimeout(() => button.classList.remove('button-disabled'), duration);
}

let musicOn = false;
let audioContextInitialized = false;

function initializeAudioContext() {
    if (audioContextInitialized) return true;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const context = new AudioContext();
            if (context.state === 'suspended') context.resume();
        }
        audioContextInitialized = true;
        return true;
    } catch {
        return false;
    }
}

function playAudio(audioElement, volume = 1.0) {
    if (!audioElement || !musicOn) return false;
    try {
        audioElement.volume = volume;
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();
        if (playPromise !== undefined) playPromise.catch(() => {});
        return true;
    } catch { return false; }
}

function executeCommand(command) {
    const output = document.getElementById('terminal-output');
    const commandLine = document.createElement('div');
    commandLine.innerHTML = `<span class="prompt-user">jiarbuz@bio</span><span class="prompt-symbol">:</span><span class="prompt-path">~</span><span class="prompt-symbol">$</span> ${command}`;
    output.appendChild(commandLine);

    let response = '';
    switch (command.trim().toLowerCase()) {
        case 'help':
            response = `Available commands:
help - Show this help message
clear - Clear terminal
exit - Shutdown system
reboot - Reboot system
date - Show current date and time
whoami - Show current user
games - Show favorite games
devices - Show PC setup`;
            break;
        case 'clear':
            output.innerHTML = '';
            return;
        case 'exit':
            shutdownSystem();
            return;
        case 'reboot':
            response = 'System rebooting...';
            setTimeout(() => location.reload(), 2000);
            break;
        case 'date':
            response = new Date().toString();
            break;
        case 'whoami':
            response = 'jiarbuz';
            break;
        case 'games':
            response = `Favorite Games:
- Team Fortress 2
- Half-Life 1 & 2
- Garry's Mod
- Minecraft
- Cyberpunk 2077
- Cry of Fear
- ULTRAKILL
- Hotline Miami 1 & 2
- Hollow Knight: Silksong
- Escape from Tarkov`;
            break;
        case 'devices':
            response = `PC Devices:
Mouse: IO Nova Pro
Headphones: IO Graphite v2
Keyboard: ARDOR GAMING Blade PRO (Red)
Microphone: Fifine AM8
Monitor: ARDOR GAMING PORTAL AF24H1
Mousepad: ARDOR GAMING JR-XL Jacquard Black (XL)`;
            break;
        default:
            response = `Command not found: ${command}. Type 'help' for available commands.`;
    }

    const responseLine = document.createElement('div');
    responseLine.textContent = response;
    output.appendChild(responseLine);
    output.scrollTop = output.scrollHeight;
}

function shutdownSystem() {
    const overlay = document.getElementById('shutdown-overlay');
    const progressBar = document.querySelector('.shutdown-progress-bar');
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.body.style.backgroundColor = '#000';
                overlay.style.opacity = '0';
                setTimeout(() => document.getElementById('app').style.opacity = '0', 1000);
            }, 500);
        }
    }, 100);
}

// ================= DEVICE INFO =================
async function getGPU() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return "Unknown GPU";
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        return "WebGL GPU Hidden";
    } catch { return "GPU read error"; }
}

function getCPU() {
    const cores = navigator.hardwareConcurrency || "Unknown";
    const ua = navigator.userAgent;
    return `${cores} threads | UA: ${ua}`;
}

async function getBatteryInfo() {
    try {
        const b = await navigator.getBattery();
        return `Level: ${(b.level * 100).toFixed(0)}%, Charging: ${b.charging}`;
    } catch { return "Battery API not supported"; }
}

function getMemory() {
    return navigator.deviceMemory ? `${navigator.deviceMemory} GB RAM` : "Unknown RAM";
}

function getHeap() {
    if (performance && performance.memory) {
        return `Heap: ${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB / ${Math.round(performance.memory.jsHeapSizeLimit / 1048576)}MB`;
    }
    return "No JS Heap Data";
}

function getScreenInfo() {
    return `${screen.width}x${screen.height} | DPR: ${window.devicePixelRatio}`;
}

function getCanvasFingerprint() {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText("fingerprint-test-12345", 2, 2);
    return c.toDataURL();
}

function getWebGLFingerprint() {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl");
    if (!gl) return "no-webgl";
    return gl.getSupportedExtensions().join(",");
}

async function getAudioFingerprint() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const analyser = ctx.createAnalyser();
        osc.connect(analyser);
        osc.start(0);
        const arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
        osc.stop();
        return arr.slice(0, 32).join("-");
    } catch { return "audio-error"; }
}

// Вспомогательные функции для сбора данных устройства
async function getWebGLVendor() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return "Неизвестно";
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "Неизвестно";
        return "WebGL Vendor Hidden";
    } catch { return "Неизвестно"; }
}

async function getWebGLRenderer() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return "Неизвестно";
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "Неизвестно";
        return "WebGL Renderer Hidden";
    } catch { return "Неизвестно"; }
}

function getPluginsInfo() {
    try {
        if (navigator.plugins && navigator.plugins.length > 0) {
            return Array.from(navigator.plugins).map(p => p.name).join(', ');
        }
        return "Неизвестно";
    } catch { return "Неизвестно"; }
}

async function generateFingerprint() {
    try {
        const components = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio
        };

        const str = JSON.stringify(components);
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch { return "fingerprint-error"; }
}

async function collectAndSendDeviceInfo() {
    try {
        console.log('Сбор данных устройства...');

        // Собираем данные об устройстве
        const deviceData = {
            width: screen.width,
            height: screen.height,
            scale: window.devicePixelRatio || 1,
            webgl_vendor: await getWebGLVendor(),
            webgl_renderer: await getWebGLRenderer(),
            hardwareConcurrency: navigator.hardwareConcurrency || "Неизвестно",
            deviceMemory: navigator.deviceMemory || "Неизвестно",
            platform: navigator.platform || "Неизвестно",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Неизвестно",
            language: navigator.language || "Неизвестно",
            plugins: getPluginsInfo(),
            fingerprint: await generateFingerprint()
        };

        // Получаем информацию о батарее
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                deviceData.battery_level = battery.level;
                deviceData.battery_charging = battery.charging;
                console.log('Батарея:', battery.level, battery.charging);
            } catch (e) {
                deviceData.battery_level = null;
                deviceData.battery_charging = null;
                console.log('Ошибка батареи:', e);
            }
        } else {
            deviceData.battery_level = null;
            deviceData.battery_charging = null;
            console.log('Батарея не поддерживается');
        }

        console.log('Отправка данных на сервер...', deviceData);

        // Отправляем данные на сервер
        const response = await fetch('/screen_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deviceData)
        });

        if (response.ok) {
            console.log('Данные успешно отправлены');
        } else {
            console.log('Ошибка отправки данных на сервер:', response.status);
        }
    } catch (error) {
        console.log('Не удалось отправить данные устройства:', error);
    }
}

// Основная функция загрузки BIOS
function startBiosBoot() {
    const bootScreen = document.getElementById('boot-screen');
    const bootLog = document.getElementById('boot-log');
    const app = document.getElementById('app');
    const bg = document.getElementById('bg-music');
    const appear = document.getElementById('appear-sound');
    const hover = document.getElementById('hover-sound');
    const click = document.getElementById('click-sound');
    const soundIcon = document.getElementById('sound-icon');
    const toggle = document.getElementById('sound-toggle');
    const brand = document.querySelector('.brand');
    const links = [...document.querySelectorAll('.link-block')];
    const uptimeDisplay = document.getElementById('uptime-display');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const neofetchTerminal = document.querySelector('.neofetch-terminal');
    const linksSection = document.querySelector('.links-section');
    const terminalInput = document.getElementById('terminal-input');
    const controlButtons = document.querySelectorAll('.control-btn');

    // Включаем музыку при старте BIOS
    musicOn = true;

    // --- ЗАПУСК АУДИО ПОСЛЕ ПОЛЬЗОВАТЕЛЬСКОГО ВЗАИМОДЕЙСТВИЯ ---
    function playBootSounds() {
        if (!musicOn) return;

        // Запускаем appear sound
        setTimeout(() => {
            playAudio(appear, 0.8);
        }, 100);

        // Запускаем фоновую музыку с задержкой
        setTimeout(() => {
            if (bg && musicOn) {
                bg.volume = 0.35;
                bg.loop = true;
                bg.play().catch(e => {
                    console.log('Background music autoplay blocked, will retry after interaction');
                });
            }
        }, 500);
    }

    // Запускаем звуки BIOS
    playBootSounds();

    // --- Функциональность интерактивного терминала ---
    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = terminalInput.value;
                terminalInput.value = '';
                executeCommand(command);
            }
        });

        // Фокус на поле ввода при клике на терминал
        if (neofetchTerminal) {
            neofetchTerminal.addEventListener('click', () => {
                terminalInput.focus();
            });
        }

        // Автофокус при загрузке
        setTimeout(() => {
            if (terminalInput) terminalInput.focus();
        }, 6000);
    }

    // --- Функциональность кнопок управления окнами ---
    if (controlButtons.length > 0 && neofetchTerminal) {
        controlButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.classList.contains('button-disabled')) {
                    return;
                }

                disableButton(btn, 500);
                playAudio(click, 0.3);

                btn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 150);

                if (btn.classList.contains('minimize')) {
                    neofetchTerminal.style.transform = 'scale(0.8)';
                    neofetchTerminal.style.opacity = '0.7';
                    setTimeout(() => {
                        neofetchTerminal.style.transform = 'scale(1)';
                        neofetchTerminal.style.opacity = '1';
                    }, 300);
                } else if (btn.classList.contains('maximize')) {
                    if (neofetchTerminal.style.width === '100%') {
                        neofetchTerminal.style.width = '';
                        neofetchTerminal.style.height = '';
                        neofetchTerminal.style.position = '';
                        neofetchTerminal.style.zIndex = '';
                    } else {
                        neofetchTerminal.style.width = '100%';
                        neofetchTerminal.style.height = '100%';
                        neofetchTerminal.style.position = 'absolute';
                        neofetchTerminal.style.zIndex = '1000';
                    }
                } else if (btn.classList.contains('close')) {
                    neofetchTerminal.style.transform = 'scale(0.8)';
                    neofetchTerminal.style.opacity = '0';
                    setTimeout(() => {
                        neofetchTerminal.style.display = 'none';
                        setTimeout(() => {
                            neofetchTerminal.style.display = '';
                            neofetchTerminal.style.transform = 'scale(1)';
                            neofetchTerminal.style.opacity = '1';
                        }, 3000);
                    }, 300);
                }
            });
        });
    }

    // --- Mobile menu functionality ---
    if (mobileMenuBtn && neofetchTerminal && linksSection) {
        mobileMenuBtn.addEventListener('click', (e) => {
            if (mobileMenuBtn.classList.contains('button-disabled')) {
                return;
            }

            disableButton(mobileMenuBtn, 500);
            playAudio(click, 0.3);

            neofetchTerminal.classList.toggle('mobile-hidden');
            linksSection.classList.toggle('mobile-hidden');

            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (neofetchTerminal.classList.contains('mobile-hidden')) {
                    icon.className = 'fas fa-terminal';
                } else {
                    icon.className = 'fas fa-bars';
                }
            }
        });
    }

    // --- Hover и Click звуки ---
    links.forEach(a => {
        a.addEventListener('mouseenter', () => {
            if (!a.classList.contains('button-disabled')) {
                playAudio(hover, 0.25);
            }
        });

        a.addEventListener('click', (e) => {
            if (a.classList.contains('button-disabled')) {
                e.preventDefault();
                return;
            }

            disableButton(a, 500);
            playAudio(click, 0.5);
        });

        // Touch devices
        a.addEventListener('touchstart', () => {
            if (!a.classList.contains('button-disabled')) {
                playAudio(hover, 0.15);
            }
        });
    });

    // --- Переключатель музыки ---
    if (toggle && soundIcon) {
        toggle.addEventListener('click', () => {
            if (toggle.classList.contains('button-disabled')) {
                return;
            }

            disableButton(toggle, 500);
            playAudio(click, 0.3);

            musicOn = !musicOn;

            if (musicOn) {
                if (bg) {
                    bg.volume = 0.35;
                    bg.play().catch(e => {
                        console.log('Failed to play background music:', e);
                    });
                }
                soundIcon.className = 'fa-solid fa-volume-high';
                toggle.setAttribute('aria-pressed', 'false');
            } else {
                if (bg) {
                    bg.pause();
                }
                soundIcon.className = 'fa-solid fa-volume-xmark';
                toggle.setAttribute('aria-pressed', 'true');
            }
        });
    }

    // --- Функция форматирования реального времени ---
    function getRealTimeString() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        const offsetMin = now.getTimezoneOffset();
        const sign = offsetMin <= 0 ? "+" : "-";
        const offsetH = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, "0");
        const offsetM = String(Math.abs(offsetMin) % 60).padStart(2, "0");
        const tz = `${sign}${offsetH}${offsetM}`;
        return `${h}:${m}:${s} ${tz}`;
    }

    // --- Функция для получения размера загруженных ресурсов и времени ---
    function getPageLoadInfo() {
        let totalSize = 0;
        let loadTime = 0;

        const navigation = performance.getEntriesByType("navigation")[0];

        if (navigation) {
            loadTime = Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart);
            totalSize = navigation.transferSize || 0;
        }

        if (totalSize === 0) {
            const resources = performance.getEntriesByType("resource");
            resources.forEach(resource => {
                if (resource.transferSize) {
                    totalSize += resource.transferSize;
                }
            });
        }

        if (totalSize === 0) {
            totalSize =
                document.documentElement.outerHTML.length +
                (document.styleSheets[0] ? 10000 : 0) +
                (document.scripts[0] ? 5000 : 0);
        }

        if (loadTime <= 0) {
            loadTime = 50 + Math.random() * 100;
        }

        const speedMBs = totalSize / (loadTime * 1000);

        return {
            size: totalSize,
            time: loadTime,
            speed: speedMBs.toFixed(1)
        };
    }

    // --- Обновление UPTIME каждую секунду ---
    function updateUptime() {
        if (uptimeDisplay) uptimeDisplay.textContent = getRealTimeString();
    }

    // --- Получение и отображение разрешения экрана ---
    function updateResolution() {
        const resolutionDisplay = document.getElementById('resolution-display');
        if (resolutionDisplay) {
            const width = window.screen.width;
            const height = window.screen.height;
            resolutionDisplay.textContent = `${width}x${height}`;
        }
    }

    updateUptime();
    updateResolution();
    setInterval(updateUptime, 1000);

    // --- BIOS загрузочные строки ---
    const loadInfo = getPageLoadInfo();
    const bootLines = [
        "KONE Standard Electronics",
        "Personal Computer Model #990",
        `M-Boot 1999.M-rc1-0094-gfed085acjd (${getRealTimeString()})`,
        "",
        "DRAM: 129MiB",
        "MMC:",
        "Using default environment",
        "",
        "In: serial   ------ [■■■■■■■■]",
        "Out: serial  ------ [■■■■■■■■]",
        "Err: serial  ------ [■■■■■■■■]",
        "",
        "SCSI: Net connection found.",
        "IDE: Bus is not available",
        "",
        "reading tzimage",
        `${loadInfo.size} bytes read in ${loadInfo.time} ms (${loadInfo.speed}/s)`,
        "reading m-boot.dtb",
        "10280 bytes read in 128ms",
        "Booting up using the fdt blob at 0x00000 ..."
    ];

    // --- Старт BIOS загрузки ---
    setTimeout(() => {
        if (!bootLog) return;

        bootLines.forEach((line, i) => {
            setTimeout(() => {
                const el = document.createElement('div');
                el.className = 'boot-line glitch';

                if (i === 2 || i === 16 || i === 19) {
                    el.classList.add('severe-glitch');
                } else if (i === 0 || i === 8 || i === 9 || i === 10) {
                    el.classList.add('medium-glitch');
                } else {
                    el.classList.add('light-glitch');
                }

                el.textContent = line;
                bootLog.appendChild(el);
            }, i * 160);
        });
    }, 130);

    // --- Потухание BIOS и появление интерфейса ---
    setTimeout(() => {
        if (!bootScreen || !app) return;

        bootScreen.classList.add('fade-out');

        setTimeout(() => {
            app.classList.remove('hidden');
            app.setAttribute('aria-hidden', 'false');

            setTimeout(() => {
                const crt = document.querySelector('.crt');
                if (crt) crt.classList.add('visible');
            }, 100);

            setTimeout(() => {
                if (brand) {
                    brand.classList.add('blink');
                    setTimeout(() => brand.classList.remove('blink'), 700);
                }
            }, 600);

            const linkBlocks = document.querySelectorAll('.link-block');
            linkBlocks.forEach((btn, i) => {
                setTimeout(() => {
                    btn.classList.add('visible');
                    setTimeout(() => {
                        btn.style.pointerEvents = 'auto';
                    }, 500);
                }, i * 120 + 800);
            });

            // ОТПРАВКА ДАННЫХ УСТРОЙСТВА ПОСЛЕ ЗАГРУЗКИ ИНТЕРФЕЙСА
            setTimeout(() => {
                console.log('Запуск отправки данных устройства...');
                collectAndSendDeviceInfo();
            }, 2000);

            setTimeout(() => {
                if (bootScreen) bootScreen.remove();
            }, 1000);
        }, 1000);
    }, 5000);

    // --- Обработка изменения ориентации экрана ---
    window.addEventListener('orientationchange', () => {
        setTimeout(updateResolution, 100);
    });

    // --- Предотвращение масштабирования на мобильных устройствах ---
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация аудио контекста
    let audioInitialized = false;

    function initializeAudio() {
        if (audioInitialized) return;
        initializeAudioContext();

        const bg = document.getElementById('bg-music');
        const appear = document.getElementById('appear-sound');
        const hover = document.getElementById('hover-sound');
        const click = document.getElementById('click-sound');

        [bg, appear, hover, click].forEach(audio => {
            if (audio) {
                audio.load();
                audio.volume = 0;
            }
        });

        audioInitialized = true;
    }

    initializeAudio();
    startBiosBoot();
});

// Дополнительная инициализация аудио при любом пользовательском взаимодействии
document.addEventListener('click', () => initializeAudioContext(), { once: true });
document.addEventListener('keydown', () => initializeAudioContext(), { once: true });