// main.js
// Loads and initializes the AI-Agent Capability Radar chart and its interactive controls

import './stretchScale.js';  // Ensure custom radial-stretch scale is registered before Chart.js usage

(async () => {
  'use strict';

  // ------------------------------
  // 1. Efficacy lookup mapping
  // map[causalImpact][environment] -> numeric efficacy score (0–5)
  const efficacyMap = {
    'Observation only':    { Simulated: 0, Mediated: 0, Physical: 0 },
    'Minor impact':        { Simulated: 1, Mediated: 2, Physical: 3 },
    'Intermediate impact': { Simulated: 2, Mediated: 3, Physical: 4 },
    'Comprehensive impact':{ Simulated: 3, Mediated: 4, Physical: 5 }
  };

  // ------------------------------
  // 2. Core constants and data
  const AXES = ['Autonomy', 'Efficacy', 'Goal-complexity', 'Generality'];

  // Fetch default agents…
  const defaultAgents = await fetch('agents.json').then(r => r.json());
  // …then load saved ones and merge
  const saved       = JSON.parse(localStorage.getItem('customAgents') || '[]');
  const agents      = [ ...defaultAgents, ...saved ];


  // ------------------------------
  // 3. DOM references for interactivity
  const sel     = document.getElementById('agent-select');   // multi-select list of agents
  const slider  = document.getElementById('stretch-slider'); // range input for axis stretch
  const readout = document.getElementById('stretch-readout');// displays stretch %
  const form    = document.getElementById('custom-form');    // form for adding custom agent
  const resetBtn  = document.getElementById('reset-btn');  
  let rafId = null;  // holds current requestAnimationFrame ID

  // ------------------------------
  // 4. Color palette for chart datasets [borderColor, backgroundColor]
  const palette = [
    ['#0072B2', 'rgba(0,114,178,0.25)'],  // blue
    ['#E69F00', 'rgba(230,159,0,0.25)'],  // orange
    ['#009E73', 'rgba(0,158,115,0.25)']   // green
  ];

  // ------------------------------
  // 5. Helper functions
  const t        = () => +slider.value;                              // current stretch factor
  const setLabel = v => readout.textContent = `${Math.round(v * 100)}% stretched`;
  const byName   = name => agents.find(a => a.name === name);        // find agent by name
  const refreshSelect = () => {
    sel.innerHTML = agents.map(a => `<option>${a.name}</option>`).join('');
  };
  refreshSelect(); // populate agent list

  // Build up to 3 datasets for Chart.js from selected agent names
  const makeDatasets = names => names.slice(0, 3).map((name, i) => ({
    label: name,
    data: AXES.map(axis => byName(name)[axis]),
    borderColor: palette[i][0],
    backgroundColor: palette[i][1],
    borderWidth: 2,
    fill: true
  }));

  // ------------------------------
  // 6. Initialize the radar chart
  const chart = new Chart(
    document.getElementById('radar'),
    {
      type: 'radar',
      data: {
        labels: AXES,
        datasets: makeDatasets([agents[0].name]) // default to first agent
      },
      options: {
        responsive: true,
        animation: false,
        layout: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
        scales: {
          r: {
            type: 'radialStretch', // custom scale
            beginAtZero: true,
            max: 5,
            stretch: 0,
            K: 20,                  // base of exponential curve
            pointLabels: {         // label styling
              display: true,
              color: '#333',
              padding: 8,
              font: {
                family: 'system-ui, sans-serif',
                size: 14,
                weight: 'normal'
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            onClick: (e, item, legend) => {
              const idx = item.datasetIndex;
              legend.chart.toggleDataVisibility(idx);
              legend.chart.update();
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const AX = ['A','E','GC','G'][ctx.dataIndex];
                const raw = ctx.dataset.data[ctx.dataIndex];
                return `${ctx.dataset.label} – ${AX}: ${raw}`;
              }
            }
          }
        }
      }
    }
  );

  // Ensure chart re-measures and redraws on window resize
  window.addEventListener('resize', () => {
    chart.resize();
    chart.update('none');
  });

  // ------------------------------
  // 7. Chart update logic
  function updateChart() {
    const selected = [...sel.selectedOptions].map(o => o.value);
    const names = selected.length ? selected : [agents[0].name];
    chart.data.datasets = makeDatasets(names);
    chart.update('none');
  }

  // Download chart as PNG
  document.getElementById('dl-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = chart.toBase64Image();
    link.download = 'AI-agent-radar.png';
    link.click();
  });

  // New code
  
    form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const obj = { name: data.get('name') };

    AXES.forEach(axis => {
      if (axis === 'Efficacy') {
        const causal = data.get('CausalImpact');
        const env    = data.get('Environment');
        obj[axis] = efficacyMap[causal][env];
      } else {
        obj[axis] = Number(data.get(axis));
      }
    });
    
    // overwrite or append
    const existingIdx = agents.findIndex(a => a.name === obj.name);
    if (existingIdx !== -1) {
      agents[existingIdx] = obj;
    } else {
      agents.push(obj);
    }
    
    // 2) save to localStorage
    let customs = JSON.parse(localStorage.getItem('customAgents') || '[]');
    customs = customs.filter(a => a.name !== obj.name);
    customs.push(obj);
    localStorage.setItem('customAgents', JSON.stringify(customs));
    
    // 3) refresh UI
    refreshSelect();
    [...sel.options].forEach(o => o.selected = o.value === obj.name);
    chart.data.datasets = makeDatasets([obj.name]);
    chart.update('none');
    form.reset();
  });

  // 8b. Wire up reset button
  resetBtn.addEventListener('click', () => {
    localStorage.removeItem('customAgents');
    // reload to reset agents[] to defaults
    window.location.reload();
  });

  // End new code


  // Handle stretch slider input with animation frame throttling
  slider.addEventListener('input', () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      chart.options.scales.r.stretch = t();
      setLabel(t());
      chart.update('none');
    });
  });

  // Update chart when agent selection changes
  sel.addEventListener('change', updateChart);

  // ------------------------------

    
    
    


  // Initialize stretch readout display
  setLabel(0);
})();
