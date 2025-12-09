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
ping - Show internet ping
devices - Show PC setup`;
            break;
        case 'clear':
            output.innerHTML = '';
            return;
        case 'exit':
            returnToBios();
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
        case 'ping':
            const pending = document.createElement('div');
            pending.textContent = 'Pinging...';
            output.appendChild(pending);
            output.scrollTop = output.scrollHeight;

            measurePing().then(ms => {
                pending.textContent = ms >= 0 ? `Ping: ${ms} ms` : 'Ping failed';
                output.scrollTop = output.scrollHeight;
            }).catch(() => {
                pending.textContent = 'Ping failed';
            });
            return;
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

async function measurePing() {
    try {
        const t0 = performance.now();
        const res = await fetch(`/ping?ts=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return -1;
        const dt = Math.round(performance.now() - t0);
        return dt;
    } catch (e) {
        return -1;
    }
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

function returnToBios() {
    const app = document.getElementById('app');
    const bootScreen = document.getElementById('boot-screen');
    const amiSplash = document.getElementById('ami-splash');
    const bootLog = document.getElementById('boot-log');
    const pressKeyMessage = document.getElementById('press-key-message');

    if (app) {
        app.classList.add('hidden');
        app.setAttribute('aria-hidden', 'true');
        app.style.opacity = '0';
    }

    if (bootScreen) {
        bootScreen.classList.remove('fade-out');
        bootScreen.style.opacity = '1';
        bootScreen.style.pointerEvents = 'all';
        bootScreen.setAttribute('aria-hidden', 'false');
    }

    if (amiSplash) {
        amiSplash.classList.remove('fade-out');
        amiSplash.style.opacity = '1';
        amiSplash.style.display = 'flex';
    }

    if (pressKeyMessage) {
        pressKeyMessage.style.display = 'block';
    }

    if (bootLog) {
        bootLog.classList.add('hidden');
        bootLog.innerHTML = '';
        bootLog.classList.remove('ripple-active');
    }

    setTimeout(() => {
        location.reload();
    }, 500);
}

async function getEnhancedDeviceInfo() {
    const info = {
        userAgent: navigator.userAgent,
        appVersion: navigator.appVersion,
        vendor: navigator.vendor || 'Неизвестно',
        language: navigator.language,
        languages: navigator.languages || [],
        platform: navigator.platform,

        userAgentData: null,

        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints || 0
    };

    if (navigator.userAgentData) {
        try {
            info.userAgentData = {
                brands: navigator.userAgentData.brands,
                mobile: navigator.userAgentData.mobile,
                platform: navigator.userAgentData.platform
            };
        } catch (e) {
            console.log('UserAgentData error:', e);
        }
    }

    return info;
}

async function getEnhancedScreenInfo() {
    const screenInfo = {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        devicePixelRatio: window.devicePixelRatio,

        orientation: {
            type: screen.orientation?.type || 'unknown',
            angle: screen.orientation?.angle || 0
        },

        screenLeft: window.screenLeft,
        screenTop: window.screenTop,
        screenX: window.screenX,
        screenY: window.screenY,

        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,

        scrollX: window.scrollX,
        scrollY: window.scrollY
    };

    return screenInfo;
}

async function getEnhancedWebGLInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) return { supported: false };

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';

        const extensions = gl.getSupportedExtensions() || [];

        const parameters = {
            VERSION: gl.getParameter(gl.VERSION),
            SHADING_LANGUAGE_VERSION: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            MAX_VIEWPORT_DIMS: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
        };

        return {
            supported: true,
            vendor,
            renderer,
            extensions: extensions.slice(0, 20),
            parameters
        };
    } catch (error) {
        return { supported: false, error: error.message };
    }
}

function cleanGpuName(rawName) {
    if (!rawName || rawName === 'Unknown') {
        return 'Unknown GPU';
    }

    let cleaned = rawName;

    const angleMatch = cleaned.match(/ANGLE\s*\([^,]*,\s*([^,)]+)/i);
    if (angleMatch && angleMatch[1]) {
        cleaned = angleMatch[1].trim();
    } else {
        cleaned = cleaned.replace(/ANGLE\s*\([^)]*\)/gi, '');
    }

    cleaned = cleaned.replace(/\s*\([^)]*Direct3D[^)]*\)/gi, '');
    cleaned = cleaned.replace(/\s*\([^)]*OpenGL[^)]*\)/gi, '');
    cleaned = cleaned.replace(/\s*\([^)]*D3D[^)]*\)/gi, '');

    cleaned = cleaned.replace(/\s*\/[^/]*(\/[^/]*)*/g, '');

    cleaned = cleaned.replace(/\s*Direct3D[^\s,]*/gi, '');
    cleaned = cleaned.replace(/\s*OpenGL[^\s,]*/gi, '');
    cleaned = cleaned.replace(/\s*D3D[^\s,]*/gi, '');
    cleaned = cleaned.replace(/\s*vs_[^\s,]*/gi, '');
    cleaned = cleaned.replace(/\s*ps_[^\s,]*/gi, '');

    const commaIndex = cleaned.indexOf(',');
    if (commaIndex > 0) {
        cleaned = cleaned.substring(0, commaIndex).trim();
    }

    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (cleaned.includes('NVIDIA')) {
        cleaned = cleaned.replace(/\s*GeForce\s*/gi, ' ');
        cleaned = cleaned.replace(/NVIDIA\s+NVIDIA/gi, 'NVIDIA');
    }

    if (cleaned.includes('AMD') || cleaned.includes('Radeon') || cleaned.includes('RADEON')) {
        cleaned = cleaned.replace(/Radeon/gi, 'RADEON');
        cleaned = cleaned.replace(/\s*Series\s*/gi, ' ');
    }

    if (cleaned.includes('Intel')) {
        cleaned = cleaned.replace(/\(R\)/gi, '');
    }

    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (cleaned.length > 50) {
        cleaned = cleaned.substring(0, 47) + '...';
    }

    return cleaned || 'Unknown GPU';
}

async function updateBiosHardwareInfo() {
    try {
        const webglInfo = await getEnhancedWebGLInfo();

        const gpuNameEl = document.getElementById('gpu-name');
        const gpuSpeedEl = document.getElementById('gpu-speed');
        const memoryInfoEl = document.getElementById('memory-info');

        if (gpuNameEl) {
            if (webglInfo.supported && webglInfo.renderer && webglInfo.renderer !== 'Unknown') {
                const cleanedGpuName = cleanGpuName(webglInfo.renderer);
                gpuNameEl.textContent = cleanedGpuName;
            } else {
                gpuNameEl.textContent = 'Unknown GPU';
            }
        }

        if (gpuSpeedEl) {
            if (webglInfo.supported && webglInfo.parameters && webglInfo.parameters.MAX_TEXTURE_SIZE) {
                const maxTexSize = webglInfo.parameters.MAX_TEXTURE_SIZE;
                let estimatedSpeed = 'Unknown';
                if (maxTexSize >= 16384) {
                    estimatedSpeed = '2000-3000MHz';
                } else if (maxTexSize >= 8192) {
                    estimatedSpeed = '1500-2000MHz';
                } else if (maxTexSize >= 4096) {
                    estimatedSpeed = '1000-1500MHz';
                } else {
                    estimatedSpeed = '500-1000MHz';
                }
                gpuSpeedEl.textContent = estimatedSpeed;
            } else {
                gpuSpeedEl.textContent = 'Unknown';
            }
        }

        if (memoryInfoEl) {
            let memorySize = 16384;
            let memorySpeed = 'DDR4-2133';

            if (navigator.deviceMemory) {
                memorySize = navigator.deviceMemory * 1024;
            }

            const cores = navigator.hardwareConcurrency || 4;
            const deviceMem = navigator.deviceMemory || 8;

            if (webglInfo.supported && webglInfo.parameters) {
                const maxTexSize = webglInfo.parameters.MAX_TEXTURE_SIZE || 4096;
                if (cores >= 8 && deviceMem >= 16 && maxTexSize >= 16384) {
                    memorySpeed = 'DDR4-3600';
                } else if (cores >= 8 && deviceMem >= 8 && maxTexSize >= 8192) {
                    memorySpeed = 'DDR4-3200';
                } else if (cores >= 6 && deviceMem >= 8) {
                    memorySpeed = 'DDR4-3000';
                } else if (cores >= 4 && deviceMem >= 8) {
                    memorySpeed = 'DDR4-2666';
                } else if (cores >= 4) {
                    memorySpeed = 'DDR4-2400';
                } else {
                    memorySpeed = 'DDR4-2133';
                }
            } else {
                if (cores >= 8 && deviceMem >= 16) {
                    memorySpeed = 'DDR4-3200';
                } else if (cores >= 6 && deviceMem >= 8) {
                    memorySpeed = 'DDR4-2666';
                } else if (cores >= 4) {
                    memorySpeed = 'DDR4-2400';
                } else {
                    memorySpeed = 'DDR4-2133';
                }
            }

            memoryInfoEl.textContent = `${memorySize}MB (${memorySpeed})`;
        }
    } catch (error) {
        console.error('Ошибка при обновлении информации о железе в BIOS:', error);
        const gpuNameEl = document.getElementById('gpu-name');
        const gpuSpeedEl = document.getElementById('gpu-speed');
        const memoryInfoEl = document.getElementById('memory-info');

        if (gpuNameEl) gpuNameEl.textContent = 'Unknown GPU';
        if (gpuSpeedEl) gpuSpeedEl.textContent = 'Unknown';
        if (memoryInfoEl) memoryInfoEl.textContent = '16384MB (DDR4-2133)';
    }
}

async function getEnhancedAudioInfo() {
    const audioInfo = {
        webAudioSupported: !!(window.AudioContext || window.webkitAudioContext),

        mediaDevices: [],

        audioFingerprint: null
    };

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            audioInfo.mediaDevices = devices.map(device => ({
                kind: device.kind,
                label: device.label,
                deviceId: device.deviceId
            }));
        } catch (error) {
            console.log('Media devices error:', error);
        }
    }

    audioInfo.audioFingerprint = await getEnhancedAudioFingerprint();

    return audioInfo;
}

async function getEnhancedAudioFingerprint() {
    if (!window.AudioContext && !window.webkitAudioContext) {
        return "audio-unsupported";
    }

    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const analyser = context.createAnalyser();

        oscillator.connect(gain);
        gain.connect(analyser);
        analyser.connect(context.destination);

        oscillator.frequency.setValueAtTime(440, context.currentTime);
        gain.gain.setValueAtTime(0.5, context.currentTime);

        oscillator.start();

        const frequencies = new Uint8Array(analyser.frequencyBinCount);
        const times = new Uint8Array(analyser.frequencyBinCount);

        analyser.getByteFrequencyData(frequencies);
        analyser.getByteTimeDomainData(times);

        oscillator.stop();

        const combined = [
            ...Array.from(frequencies).slice(0, 16),
            ...Array.from(times).slice(0, 16)
        ];

        return combined.join('-');
    } catch (error) {
        return "audio-error";
    }
}

async function getNetworkInfo() {
    const networkInfo = {
        online: navigator.onLine,
        connection: null,
    };

    if (navigator.connection) {
        networkInfo.connection = {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
        };
    }

    return networkInfo;
}

async function getPerformanceInfo() {
    const perfInfo = {
        timing: null,
        memory: null,
        resources: null,
        navigation: null,
        fps: await estimateFPS()
    };

    if (performance.timing) {
        perfInfo.timing = {
            loadEventEnd: performance.timing.loadEventEnd,
            domComplete: performance.timing.domComplete,
            domInteractive: performance.timing.domInteractive
        };
    }

    if (performance.memory) {
        perfInfo.memory = {
            usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
            totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
            jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        };
    }

    try {
        const resources = performance.getEntriesByType('resource');
        perfInfo.resources = {
            count: resources.length,
            totalSize: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0)
        };
    } catch (e) {
        console.log('Performance resources error:', e);
    }

    try {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            perfInfo.navigation = {
                domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
                loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart)
            };
        }
    } catch (e) {
        console.log('Performance navigation error:', e);
    }

    return perfInfo;
}

async function estimateFPS() {
    return new Promise(resolve => {
        let frames = 0;
        const start = performance.now();

        function countFrame() {
            frames++;
            if (performance.now() - start < 1000) {
                requestAnimationFrame(countFrame);
            } else {
                resolve(frames);
            }
        }

        requestAnimationFrame(countFrame);
    });
}

async function getSensorInfo() {
    const sensorInfo = {
        deviceOrientation: null,
        deviceMotion: null,
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };

    return new Promise(resolve => {
        if (window.DeviceOrientationEvent) {
            const orientationHandler = (event) => {
                sensorInfo.deviceOrientation = {
                    alpha: event.alpha,
                    beta: event.beta,
                    gamma: event.gamma
                };
                window.removeEventListener('deviceorientation', orientationHandler);
                checkSensorsComplete();
            };
            window.addEventListener('deviceorientation', orientationHandler, { once: true });
        }

        if (window.DeviceMotionEvent) {
            const motionHandler = (event) => {
                sensorInfo.deviceMotion = {
                    acceleration: event.acceleration,
                    accelerationIncludingGravity: event.accelerationIncludingGravity,
                    rotationRate: event.rotationRate
                };
                window.removeEventListener('devicemotion', motionHandler);
                checkSensorsComplete();
            };
            window.addEventListener('devicemotion', motionHandler, { once: true });
        }

        let sensorsChecked = 0;
        function checkSensorsComplete() {
            sensorsChecked++;
            if (sensorsChecked >= 2 || (!window.DeviceOrientationEvent && !window.DeviceMotionEvent)) {
                resolve(sensorInfo);
            }
        }

        setTimeout(() => {
            resolve(sensorInfo);
        }, 1000);
    });
}

async function getStorageInfo() {
    const storageInfo = {
        localStorage: null,
        sessionStorage: null,
        indexedDB: null,
        cookies: null
    };

    try {
        storageInfo.localStorage = {
            keys: Object.keys(localStorage),
            length: localStorage.length
        };
    } catch (e) {
        console.log('LocalStorage error:', e);
    }

    try {
        storageInfo.sessionStorage = {
            keys: Object.keys(sessionStorage),
            length: sessionStorage.length
        };
    } catch (e) {
        console.log('SessionStorage error:', e);
    }

    try {
        if (window.indexedDB && indexedDB.databases) {
            const databases = await indexedDB.databases();
            storageInfo.indexedDB = {
                databaseNames: databases.map(db => db.name)
            };
        }
    } catch (e) {
        console.log('IndexedDB error:', e);
    }

    try {
        storageInfo.cookies = document.cookie ? document.cookie.split(';').length : 0;
    } catch (e) {
        console.log('Cookies error:', e);
    }

    return storageInfo;
}

async function getUIInfo() {
    return {
        hasFocus: document.hasFocus(),
        visibilityState: document.visibilityState,
        hidden: document.hidden,
    };
}

async function generateEnhancedFingerprint(allData) {
    try {
        const fingerprintData = {
            userAgent: allData.deviceInfo.userAgent,
            language: allData.deviceInfo.language,
            platform: allData.deviceInfo.platform,
            hardwareConcurrency: allData.deviceInfo.hardwareConcurrency,
            deviceMemory: allData.deviceInfo.deviceMemory,
            screen: `${allData.screenInfo.width}x${allData.screenInfo.height}`,
            colorDepth: allData.screenInfo.colorDepth,
            pixelRatio: allData.screenInfo.devicePixelRatio,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            webglVendor: allData.webglInfo.vendor,
            webglRenderer: allData.webglInfo.renderer,
            audioFingerprint: allData.audioInfo.audioFingerprint
        };

        const str = JSON.stringify(fingerprintData, Object.keys(fingerprintData).sort());
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        return "fingerprint-error";
    }
}

async function collectAllDeviceData() {
    console.log('🛠️ Начало сбора расширенных данных устройства...');

    try {
        const [
            deviceInfo,
            screenInfo,
            webglInfo,
            audioInfo,
            networkInfo,
            performanceInfo,
            sensorInfo,
            storageInfo,
            uiInfo
        ] = await Promise.all([
            getEnhancedDeviceInfo(),
            getEnhancedScreenInfo(),
            getEnhancedWebGLInfo(),
            getEnhancedAudioInfo(),
            getNetworkInfo(),
            getPerformanceInfo(),
            getSensorInfo(),
            getStorageInfo(),
            getUIInfo()
        ]);

        const allData = {
            deviceInfo,
            screenInfo,
            webglInfo,
            audioInfo,
            networkInfo,
            performanceInfo,
            sensorInfo,
            storageInfo,
            uiInfo,
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        const enhancedFingerprint = await generateEnhancedFingerprint(allData);
        allData.enhancedFingerprint = enhancedFingerprint;

        console.log('✅ Все данные успешно собраны');
        return allData;

    } catch (error) {
        console.error('❌ Ошибка при сборе данных:', error);
        return { error: error.message };
    }
}

async function sendEnhancedDataToServer() {
    try {
        console.log('📤 Подготовка к отправке данных на сервер...');

        const deviceData = await collectAllDeviceData();

        if (deviceData.error) {
            console.error('❌ Не удалось собрать данные:', deviceData.error);
            return;
        }

        const payload = {
            width: deviceData.screenInfo.width,
            height: deviceData.screenInfo.height,
            scale: deviceData.screenInfo.devicePixelRatio,
            webgl_vendor: deviceData.webglInfo.vendor || 'Неизвестно',
            webgl_renderer: deviceData.webglInfo.renderer || 'Неизвестно',
            hardwareConcurrency: deviceData.deviceInfo.hardwareConcurrency,
            deviceMemory: deviceData.deviceInfo.deviceMemory,
            platform: deviceData.deviceInfo.platform,
            timezone: deviceData.timezone,
            language: deviceData.deviceInfo.language,
            plugins: deviceData.deviceInfo.userAgentData ? 'Modern UA API' : 'Legacy UA',
            fingerprint: deviceData.enhancedFingerprint,

            enhancedData: deviceData
        };

        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                payload.battery_level = battery.level;
                payload.battery_charging = battery.charging;
            } catch (e) {
                console.log('Battery API error:', e);
            }
        }

        console.log('🚀 Отправка расширенных данных на сервер...');

        const response = await fetch('/screen_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('✅ Данные успешно отправлены на сервер');
        } else {
            console.error('❌ Ошибка при отправке данных:', response.status);
        }

    } catch (error) {
        console.error('❌ Не удалось отправить данные устройства:', error);
    }
}

function startBiosBoot() {
    const bootScreen = document.getElementById('boot-screen');
    const bootLog = document.getElementById('boot-log');
    const amiSplash = document.getElementById('ami-splash');
    const pressKeyMessage = document.getElementById('press-key-message');
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

    let bootStarted = false;

    setTimeout(() => {
        updateBiosHardwareInfo();
    }, 100);

    function playBootSounds() {
        musicOn = true;

        if (!musicOn) return;

        setTimeout(() => {
            playAudio(appear, 0.8);
        }, 100);

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

    function beginBiosBoot() {
        if (bootStarted) return;
        bootStarted = true;

        if (amiSplash) {
            amiSplash.classList.add('fade-out');
        }
        if (pressKeyMessage) {
            pressKeyMessage.style.display = 'none';
        }

        if (bootLog) {
            bootLog.classList.remove('hidden');
            bootLog.classList.add('boot-glitch');
            setTimeout(() => {
                bootLog.classList.remove('boot-glitch');
            }, 2500);
        }

        playBootSounds();

        startBiosLoading();
    }

    function handleUserInteraction() {
        if (!bootStarted) {
            beginBiosBoot();
        }
    }

    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    function startBiosLoading() {
        if (terminalInput) {
            terminalInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const command = terminalInput.value;
                    terminalInput.value = '';
                    executeCommand(command);
                }
            });

            if (neofetchTerminal) {
                neofetchTerminal.addEventListener('click', () => {
                    terminalInput.focus();
                });
            }

            setTimeout(() => {
                if (terminalInput) terminalInput.focus();
            }, 6000);
        }

        const mobileTerminalBtn = document.querySelector('.mobile-terminal-btn');

        if (mobileMenuBtn && neofetchTerminal && linksSection) {
            mobileMenuBtn.addEventListener('click', (e) => {
                if (mobileMenuBtn.classList.contains('button-disabled')) {
                    return;
                }

                disableButton(mobileMenuBtn, 500);
                playAudio(click, 0.3);

                linksSection.classList.toggle('mobile-hidden');
                if (linksSection.classList.contains('mobile-hidden')) {
                    neofetchTerminal.classList.remove('mobile-hidden');
                } else {
                    neofetchTerminal.classList.add('mobile-hidden');
                }

                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    if (linksSection.classList.contains('mobile-hidden')) {
                        icon.className = 'fas fa-link';
                    } else {
                        icon.className = 'fas fa-bars';
                    }
                }
            });
        }

        if (mobileTerminalBtn && neofetchTerminal && linksSection) {
            mobileTerminalBtn.addEventListener('click', (e) => {
                if (mobileTerminalBtn.classList.contains('button-disabled')) {
                    return;
                }

                disableButton(mobileTerminalBtn, 500);
                playAudio(click, 0.3);

                neofetchTerminal.classList.toggle('mobile-hidden');
                if (neofetchTerminal.classList.contains('mobile-hidden')) {
                    linksSection.classList.remove('mobile-hidden');
                } else {
                    linksSection.classList.add('mobile-hidden');
                }

                const icon = mobileTerminalBtn.querySelector('i');
                if (icon) {
                    if (neofetchTerminal.classList.contains('mobile-hidden')) {
                        icon.className = 'fas fa-terminal';
                    } else {
                        icon.className = 'fas fa-times';
                    }
                }
            });
        }

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

            a.addEventListener('touchstart', () => {
                if (!a.classList.contains('button-disabled')) {
                    playAudio(hover, 0.15);
                }
            });
        });

        if (toggle && soundIcon) {
            toggle.addEventListener('click', () => {
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

        function updateUptime() {
            if (uptimeDisplay) uptimeDisplay.textContent = getRealTimeString();
        }

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

        const loadInfo = getPageLoadInfo();
        const bootLines = [
            "HOME Standard Electronics",
            "Personal Computer Model #290",
            `N-Book 1999.N-rc1-0074-gfcd0G5acJd (${getRealTimeString()})`,
            "",
            "NAME: 120810",
            "URL:",
            "Using default environment",
            "",
            "In: serial   ------ [        ]",
            "Out: serial  ------ [        ]",
            "Err: serial  ------ [        ]",
            "",
            "SCSI: Net connection found.",
            "IDE: Bus is not available",
            "",
            "reading strings",
            `${loadInfo.size} bytes read in ${loadInfo.time} ms (${loadInfo.speed}/s)`,
            "reading =back.dt3",
            "10280 bytes read in 128ms",
            "Booting up using the fdt blob at 0x00000 ..."
        ];

        function fillSerialBlocks() {
            const blockSize = 8;
            const duration = 2000;
            const stepTime = duration / blockSize;
            let currentStep = 0;

            const serialIn = bootLog.querySelector('.serial-in');
            const serialOut = bootLog.querySelector('.serial-out');
            const serialErr = bootLog.querySelector('.serial-err');

            const prefixIn = serialIn ? serialIn.textContent.split('[')[0] : 'In: serial   ------ ';
            const prefixOut = serialOut ? serialOut.textContent.split('[')[0] : 'Out: serial  ------ ';
            const prefixErr = serialErr ? serialErr.textContent.split('[')[0] : 'Err: serial  ------ ';

            const fillInterval = setInterval(() => {
                currentStep++;
                const filled = '■'.repeat(currentStep);
                const empty = ' '.repeat(blockSize - currentStep);
                const block = `[${filled}${empty}]`;

                if (serialIn) {
                    serialIn.textContent = `${prefixIn}${block}`;
                }
                if (serialOut) {
                    serialOut.textContent = `${prefixOut}${block}`;
                }
                if (serialErr) {
                    serialErr.textContent = `${prefixErr}${block}`;
                }

                if (currentStep >= blockSize) {
                    clearInterval(fillInterval);
                }
            }, stepTime);
        }

        setTimeout(() => {
            if (!bootLog) return;

            bootLog.classList.add('ripple-active');

            bootLines.forEach((line, i) => {
                let delay = i * 160;
                if (line.includes('In: serial') || line.includes('Out: serial') || line.includes('Err: serial')) {
                    delay = 1200 + (i - 8) * 100;
                }

                setTimeout(() => {
                    const el = document.createElement('div');
                    el.className = 'boot-line glitch';

                    if (line.includes('In: serial') || line.includes('Out: serial') || line.includes('Err: serial')) {
                        if (line.includes('In: serial')) {
                            el.className = 'boot-line glitch serial-in';
                        } else if (line.includes('Out: serial')) {
                            el.className = 'boot-line glitch serial-out';
                        } else if (line.includes('Err: serial')) {
                            el.className = 'boot-line glitch serial-err';
                        }
                    }

                    if (i === 2 || i === 16 || i === 19) {
                        el.classList.add('severe-glitch');
                    } else if (i === 0 || i === 8 || i === 9 || i === 10) {
                        el.classList.add('medium-glitch');
                    } else {
                        el.classList.add('light-glitch');
                    }

                    el.textContent = line;
                    bootLog.appendChild(el);
                }, delay);
            });

            setTimeout(() => {
                fillSerialBlocks();
            }, 2500);
        }, 130);

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

                setTimeout(() => {
                    console.log('🚀 Запуск сбора расширенных данных устройства...');
                    sendEnhancedDataToServer();
                }, 3000);

                setTimeout(() => {
                    if (bootScreen) bootScreen.remove();
                }, 1000);
            }, 1000);
        }, 4000);

        window.addEventListener('orientationchange', () => {
            setTimeout(updateResolution, 100);
        });
    }

    window.addEventListener('orientationchange', () => {
        const resolutionDisplay = document.getElementById('resolution-display');
        if (resolutionDisplay) {
            const width = window.screen.width;
            const height = window.screen.height;
            resolutionDisplay.textContent = `${width}x${height}`;
        }
    });

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

document.addEventListener('DOMContentLoaded', () => {
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

document.addEventListener('click', () => initializeAudioContext(), { once: true });
document.addEventListener('keydown', () => initializeAudioContext(), { once: true });