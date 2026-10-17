/**
 * WaveGauge — Interactive Telemetry & Taskbar Simulator
 * Developed by Agilitiq Ltd
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Clock in Simulated Windows 11 Taskbar
  const trayTime = document.getElementById('trayTime');
  const trayDate = document.getElementById('trayDate');

  function updateClock() {
    const now = new Date();
    if (trayTime) {
      trayTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (trayDate) {
      trayDate.textContent = now.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' });
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 2. Simulated Bandwidth Engine & History Buffer
  let useBits = false;
  let isSingleLine = false;

  let baseDownBytes = 248.6 * 1024 * 1024; // ~248 MB/s
  let baseUpBytes = 41.2 * 1024;           // ~41 KB/s
  let currentDownBytes = baseDownBytes;
  let currentUpBytes = baseUpBytes;
  let pingMs = 14;

  const maxPoints = 50;
  const historyDown = new Array(maxPoints).fill(baseDownBytes);
  const historyUp = new Array(maxPoints).fill(baseUpBytes);

  function formatBytes(bytes, inBits = false) {
    if (inBits) {
      const bits = bytes * 8;
      if (bits < 1_000) return `${bits.toFixed(0)} bps`;
      if (bits < 1_000_000) return `${(bits / 1_000).toFixed(1)} Kbps`;
      if (bits < 1_000_000_000) return `${(bits / 1_000_000).toFixed(1)} Mbps`;
      return `${(bits / 1_000_000_000).toFixed(2)} Gbps`;
    } else {
      if (bytes < 1024) return `${bytes.toFixed(0)} B/s`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
    }
  }

  // UI elements
  const wgtDown = document.getElementById('wgtDown');
  const wgtUp = document.getElementById('wgtUp');
  const wgtDownSingle = document.getElementById('wgtDownSingle');
  const wgtUpSingle = document.getElementById('wgtUpSingle');
  const dashValDown = document.getElementById('dashValDown');
  const dashValUp = document.getElementById('dashValUp');
  const dashValPing = document.getElementById('dashValPing');
  const simValDown = document.getElementById('simValDown');
  const simValUp = document.getElementById('simValUp');
  const simValPing = document.getElementById('simValPing');

  function tickSimulation() {
    // Slight natural jitter
    const jitterDown = (Math.random() - 0.48) * 0.15;
    const jitterUp = (Math.random() - 0.5) * 0.2;

    currentDownBytes = Math.max(1024 * 50, currentDownBytes * (1 + jitterDown));
    currentUpBytes = Math.max(1024 * 5, currentUpBytes * (1 + jitterUp));
    
    // Slow decay toward baseline
    currentDownBytes = currentDownBytes * 0.92 + baseDownBytes * 0.08;
    currentUpBytes = currentUpBytes * 0.92 + baseUpBytes * 0.08;

    pingMs = Math.max(8, Math.round(14 + (Math.random() - 0.5) * 6));

    // Update history
    historyDown.push(currentDownBytes);
    historyDown.shift();

    historyUp.push(currentUpBytes);
    historyUp.shift();

    // Format strings
    const strDown = formatBytes(currentDownBytes, useBits);
    const strUp = formatBytes(currentUpBytes, useBits);

    if (wgtDown) wgtDown.textContent = strDown;
    if (wgtUp) wgtUp.textContent = strUp;
    if (wgtDownSingle) wgtDownSingle.textContent = strDown;
    if (wgtUpSingle) wgtUpSingle.textContent = strUp;

    if (dashValDown) dashValDown.textContent = strDown;
    if (dashValUp) dashValUp.textContent = strUp;
    if (dashValPing) dashValPing.textContent = `${pingMs} ms`;

    if (simValDown) simValDown.textContent = strDown;
    if (simValUp) simValUp.textContent = strUp;
    if (simValPing) simValPing.textContent = `${pingMs} ms`;

    renderCanvasGraphs();
  }

  setInterval(tickSimulation, 1000);

  // 3. Canvas Rendering Functions
  const heroCanvas = document.getElementById('liveHeroCanvas');
  const teleCanvas = document.getElementById('largeTelemetryCanvas');

  function drawGraphOnCanvas(canvas, downData, upData) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Subtle Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += h / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Determine max scale
    const maxVal = Math.max(...downData, ...upData, 1024 * 1024 * 50);

    // Draw Download Area & Line (Signal Cyan #22D3EE)
    ctx.beginPath();
    const stepX = w / (downData.length - 1);
    for (let i = 0; i < downData.length; i++) {
      const x = i * stepX;
      const y = h - (downData[i] / maxVal) * (h - 14) - 6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Fill gradient under download
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const gradDown = ctx.createLinearGradient(0, 0, 0, h);
    gradDown.addColorStop(0, 'rgba(34, 211, 238, 0.22)');
    gradDown.addColorStop(1, 'rgba(34, 211, 238, 0.0)');
    ctx.fillStyle = gradDown;
    ctx.fill();

    // Draw Upload Line (Burst Amber #FFB020)
    ctx.beginPath();
    for (let i = 0; i < upData.length; i++) {
      const x = i * stepX;
      const y = h - (upData[i] / maxVal) * (h - 14) - 6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#FFB020';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  function renderCanvasGraphs() {
    drawGraphOnCanvas(heroCanvas, historyDown, historyUp);
    drawGraphOnCanvas(teleCanvas, historyDown, historyUp);
  }
  renderCanvasGraphs();

  // 4. Interactive Simulator Button Actions
  const btnBurst = document.getElementById('btnBurst');
  if (btnBurst) {
    btnBurst.addEventListener('click', () => {
      currentDownBytes = 740 * 1024 * 1024; // 740 MB/s burst!
      currentUpBytes = 85 * 1024 * 1024;   // 85 MB/s burst
      pingMs = 38;
      tickSimulation();
    });
  }

  const btnSimDownload = document.getElementById('btnSimDownload');
  if (btnSimDownload) {
    btnSimDownload.addEventListener('click', () => {
      currentDownBytes = 620 * 1024 * 1024;
      tickSimulation();
    });
  }

  const btnSimUpload = document.getElementById('btnSimUpload');
  if (btnSimUpload) {
    btnSimUpload.addEventListener('click', () => {
      currentUpBytes = 140 * 1024 * 1024;
      tickSimulation();
    });
  }

  const btnResetGraph = document.getElementById('btnResetGraph');
  if (btnResetGraph) {
    btnResetGraph.addEventListener('click', () => {
      currentDownBytes = baseDownBytes;
      currentUpBytes = baseUpBytes;
      historyDown.fill(baseDownBytes);
      historyUp.fill(baseUpBytes);
      tickSimulation();
    });
  }

  const btnToggleMode = document.getElementById('btnToggleMode');
  const widget2Line = document.getElementById('widget2Line');
  const widget1Line = document.getElementById('widget1Line');
  if (btnToggleMode) {
    btnToggleMode.addEventListener('click', () => {
      isSingleLine = !isSingleLine;
      if (isSingleLine) {
        widget2Line.classList.add('hidden');
        widget1Line.classList.remove('hidden');
      } else {
        widget1Line.classList.add('hidden');
        widget2Line.classList.remove('hidden');
      }
    });
  }

  const btnToggleUnits = document.getElementById('btnToggleUnits');
  if (btnToggleUnits) {
    btnToggleUnits.addEventListener('click', () => {
      useBits = !useBits;
      tickSimulation();
    });
  }

  // 5. Docked Widget click toggles dashboard highlight
  const dockedWidget = document.getElementById('dockedWidget');
  const previewDashboard = document.getElementById('previewDashboard');
  if (dockedWidget && previewDashboard) {
    dockedWidget.addEventListener('click', () => {
      previewDashboard.style.transform = 'scale(1.02)';
      previewDashboard.style.borderColor = '#22D3EE';
      setTimeout(() => {
        previewDashboard.style.transform = 'scale(1)';
        previewDashboard.style.borderColor = 'rgba(34, 211, 238, 0.35)';
      }, 300);
    });
  }

  // 6. Smooth Scroll on Nav Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

});
