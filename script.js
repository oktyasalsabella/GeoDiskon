let myChart = null;

// ===== FORMAT RUPIAH (logic tetap sama) =====
function idr(n) {
  return 'Rp\u00a0' + Math.round(n).toLocaleString('id-ID');
}

// ===== TAB NAVIGATION =====
function showTab(tabName) {
  // Hide semua pages
  document.querySelectorAll('.page').forEach(p => {
    p.style.display = 'none';
    p.classList.remove('active');
  });

  // Deactivate semua tabs
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  // Show halaman yang dipilih
  const page = document.getElementById('page-' + tabName);
  page.style.display = 'block';
  page.classList.add('active');

  // Activate tab button
  document.getElementById('tab-' + tabName).classList.add('active');

  // Kalau balik ke simulasi, re-render chart
  if (tabName === 'simulasi') {
    setTimeout(() => render(), 100);
  }
}

// ===== DARK / LIGHT TOGGLE =====
function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById('theme-icon');

  if (html.getAttribute('data-theme') === 'dark') {
    html.setAttribute('data-theme', 'light');
    icon.textContent = '☾';
  } else {
    html.setAttribute('data-theme', 'dark');
    icon.textContent = '☀';
  }

  // Re-render chart supaya warnanya ikut update
  if (myChart) setTimeout(() => render(), 50);
}

// ===== STEP-BY-STEP ANIMATION =====
let animInterval = null;
let animRunning  = false;
let animCurrentN = 0;

function toggleAnimation() {
  if (animRunning) {
    stopAnimation();
  } else {
    startAnimation();
  }
}

function startAnimation() {
  const n   = parseInt(document.getElementById('slider-n').value);
  const btn = document.getElementById('play-btn');

  btn.classList.add('playing');
  document.getElementById('play-icon').textContent  = '■';
  document.getElementById('play-label').textContent = 'Stop';

  document.getElementById('anim-progress').style.display = 'block';
  animRunning  = true;
  animCurrentN = 1;

  // Mulai dari step 1, naik sampai n
  animInterval = setInterval(() => {
    if (animCurrentN > n) {
      stopAnimation();
      return;
    }

    // Update step label & progress bar
    document.getElementById('anim-step').textContent = animCurrentN;
    const pct = (animCurrentN / n) * 100;
    document.getElementById('anim-bar').style.width = pct + '%';

    // Highlight baris tabel yang aktif
    document.querySelectorAll('#tbody tr').forEach((row, i) => {
      row.classList.toggle('highlighted', i === animCurrentN - 1);
    });

    // Scroll ke baris tabel yang aktif
    const activeRow = document.querySelector('#tbody tr.highlighted');
    if (activeRow) {
      activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Update chart supaya cuma tampil data sampai step sekarang
    if (myChart) {
      const a   = parseFloat(document.getElementById('harga').value)  || 100000;
      const pct2= parseFloat(document.getElementById('diskon').value) || 10;
      const r   = (100 - pct2) / 100;

      const allData = Array.from({ length: n }, (_, i) => Math.round(a * Math.pow(r, i)));
      const partialData = allData.map((val, i) => i < animCurrentN ? val : null);

      myChart.data.datasets[0].data = partialData;
      myChart.update('none');
    }

    animCurrentN++;
  }, 600);
}

function stopAnimation() {
  clearInterval(animInterval);
  animRunning = false;

  const btn = document.getElementById('play-btn');
  btn.classList.remove('playing');
  document.getElementById('play-icon').textContent  = '▶';
  document.getElementById('play-label').textContent = 'Play Simulasi';
  document.getElementById('anim-progress').style.display = 'none';

  // Hilangkan highlight semua baris
  document.querySelectorAll('#tbody tr').forEach(row => row.classList.remove('highlighted'));

  // Re-render chart full
  render();
}

// ===== MAIN RENDER (logic deret geometri TETAP SAMA) =====
function render() {
  const a   = parseFloat(document.getElementById('harga').value)  || 100000;
  const pct = parseFloat(document.getElementById('diskon').value) || 10;
  const n   = parseInt(document.getElementById('slider-n').value);
  document.getElementById('n-out').textContent = n;

  // --- LOGIC TETAP SAMA ---
  // Mencari Rasio (r)
  const r = (100 - pct) / 100;

  // Mencari Suku ke-n (Harga di setiap pembelian)
  const prices = [];
  for (let i = 1; i <= n; i++) {
    prices.push(a * Math.pow(r, i - 1));
  }

  // Menghitung Deret Geometri (Total Pengeluaran)
  const totalS     = r === 1 ? a * n : a * (1 - Math.pow(r, n)) / (1 - r);
  const totalHemat = a * n - totalS;
  // --- END LOGIC ---

  // ===== Formula Box =====
  document.getElementById('formula-box').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div>
        <div style="font-size:0.68rem;opacity:0.5;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Suku ke-n</div>
        <div>U<sub>n</sub> = a &times; r<sup>n&minus;1</sup> &nbsp;=&nbsp; ${idr(a)} &times; ${r.toFixed(2)}<sup>n&minus;1</sup></div>
      </div>
      <div>
        <div style="font-size:0.68rem;opacity:0.5;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Rasio (r)</div>
        <div>r = 1 &minus; ${pct}% = <strong style="color:#22d3ee">${r.toFixed(4)}</strong> &nbsp;&rarr;&nbsp; karena r &lt; 1, harga <strong>meluruh</strong></div>
      </div>
      <div>
        <div style="font-size:0.68rem;opacity:0.5;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Jumlah deret</div>
        <div>S<sub>n</sub> = a(1 &minus; r<sup>n</sup>) / (1 &minus; r)</div>
      </div>
      <div style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.25);border-radius:10px;padding:10px 14px;margin-top:4px;">
        S<sub>${n}</sub> = <strong style="color:#22d3ee;font-size:1rem;">${idr(totalS)}</strong>
      </div>
    </div>
  `;

  // ===== Metrics =====
  document.getElementById('metrics').innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Harga Awal</div>
      <div class="metric-value blue">${idr(a)}</div>
      <div class="metric-bar blue"></div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Bayar S<sub>${n}</sub></div>
      <div class="metric-value green">${idr(totalS)}</div>
      <div class="metric-bar green"></div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Hemat</div>
      <div class="metric-value orange">${idr(totalHemat)}</div>
      <div class="metric-bar orange"></div>
    </div>
  `;

  // ===== Tabel =====
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  prices.forEach((p, idx) => {
    const i       = idx + 1;
    const potongan = i === 1 ? 0 : prices[idx - 1] - p;
    const pctSisa  = ((p / a) * 100).toFixed(1);
    const rumus    = i === 1
      ? `${idr(a)} &times; ${r.toFixed(2)}<sup>0</sup>`
      : `${idr(a)} &times; ${r.toFixed(2)}<sup>${i - 1}</sup>`;

    tbody.innerHTML += `
      <tr>
        <td style="color:var(--text3);font-family:var(--font-mono);font-size:0.8rem;">${i}</td>
        <td style="font-family:var(--font-mono);font-weight:700;color:var(--heading);">${idr(p)}</td>
        <td>${i === 1
          ? '<span class="badge-normal">Normal</span>'
          : '<span class="badge-diskon">&minus;' + idr(potongan) + '</span>'
        }</td>
        <td class="mono hide-mobile" style="font-size:0.78rem;color:var(--text2);">${rumus}</td>
        <td>
          <span style="font-family:var(--font-mono);font-size:0.75rem;font-weight:600;color:var(--text3);">${pctSisa}%</span>
          <div class="bar-bg" style="width:80px;"><div class="bar-fill" style="width:${pctSisa}%;"></div></div>
        </td>
      </tr>
    `;
  });

  // ===== Chart =====
  const labels   = prices.map((_, i) => 'Ke-' + (i + 1));
  const dataVals = prices.map(p => Math.round(p));

  // Detect current theme for chart colors
  const isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor= isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const tickColor= isDark ? '#4a6080' : '#8aa0b8';
  const accentColor = isDark ? '#22d3ee' : '#0284c7';
  const fillColor   = isDark ? 'rgba(34,211,238,0.08)' : 'rgba(2,132,199,0.07)';

  if (myChart) myChart.destroy();
  myChart = new Chart(document.getElementById('chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Harga per pembelian',
        data: dataVals,
        borderColor: accentColor,
        backgroundColor: fillColor,
        pointBackgroundColor: accentColor,
        pointBorderColor: isDark ? '#060d1a' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
        borderWidth: 2.5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'rgba(13,24,41,0.95)' : 'rgba(255,255,255,0.97)',
          titleColor: isDark ? '#e2eaf7' : '#0a1f3c',
          bodyColor:  isDark ? '#7a94b8' : '#4a6080',
          borderColor: isDark ? 'rgba(34,211,238,0.2)' : 'rgba(2,132,199,0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          callbacks: {
            label: ctx => ' ' + idr(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 15,
            maxRotation: 0,
            font: { size: 11, family: "'JetBrains Mono', monospace" },
            color: tickColor,
          },
          grid: { color: gridColor, drawBorder: false }
        },
        y: {
          beginAtZero: false,
          ticks: {
            callback: v => 'Rp ' + (v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v),
            font: { size: 11, family: "'JetBrains Mono', monospace" },
            color: tickColor,
          },
          grid: { color: gridColor, drawBorder: false }
        }
      }
    }
  });

  document.getElementById('legend').innerHTML = `
    <span>
      <span style="display:inline-block;width:24px;height:2px;background:${accentColor};border-radius:2px;margin-right:6px;vertical-align:middle;"></span>
      U<sub>n</sub> = a &times; r<sup>n&minus;1</sup> &nbsp; (Kurva Peluruhan Harga)
    </span>
  `;
}

// ===== EVENT LISTENERS =====
document.getElementById('slider-n').addEventListener('input', () => {
  if (animRunning) stopAnimation();
  render();
});
document.getElementById('harga').addEventListener('input',  () => {
  if (animRunning) stopAnimation();
  render();
});
document.getElementById('diskon').addEventListener('input', () => {
  if (animRunning) stopAnimation();
  render();
});

// ===== INIT =====
render();
