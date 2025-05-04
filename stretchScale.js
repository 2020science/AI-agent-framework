/**
 * stretchScale.js
 * Custom radial-stretch scale plugin for Chart.js
 */
(() => {
  const Chart = window.Chart;
  const { RadialLinearScale } = Chart;

  class RadialStretchScale extends RadialLinearScale {
    static id = 'radialStretch';
    static defaults = RadialLinearScale.defaults;

    constructor(cfg) {
      super(cfg);
    }

    /**
     * Interpolate between linear and exponential radius mapping
     * based on `options.stretch` (0–1) and `options.K`.
     */
    getDistanceFromCenterForValue(value) {
      const { stretch = 0, K = 10 } = this.options;
      // clamp the value within the configured min/max
      const L = Math.max(this.min, Math.min(this.max, value));
      // linear component
      const lin = L;
      // exponential component scaled by max
      const exp = this.max * (Math.pow(K, L / this.max) - 1) / (K - 1);
      // mix linear and exponential based on stretch factor
      const mix = (1 - stretch) * lin + stretch * exp;
      // normalize and scale to drawing area
      return (mix / this.max) * this.drawingArea;
    }
  }

  // register the new scale
  Chart.register(RadialStretchScale);

  // preserve custom grid & tick styling
  Chart.defaults.scales.radialStretch.grid = {
    borderDash: [4, 4],
    color: '#ccc'
  };
  Chart.defaults.scales.radialStretch.ticks = {
    backdropColor: 'transparent',
    showLabelBackdrop: false,
    color: '#888'
  };

  // ensure point labels render and inherit correct callback
//  Chart.defaults.scales.radialStretch.pointLabels = {
//    display: true,
//    callback: label => label,
//    font: { size: 12, weight: '300' },
//    color: '#333',
//    padding: 8
//  };

  // plugin to redraw point labels on top of dataset fills
  Chart.register({
    id: 'bringPointLabelsToFront',
    afterDatasetsDraw(chart) {
      const scale = chart.scales.r;
      if (scale && typeof scale.drawPointLabels === 'function') {
        scale.drawPointLabels(chart.ctx);
      }
    }
  });
})();
