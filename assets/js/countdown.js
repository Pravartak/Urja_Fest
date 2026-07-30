// Live countdown to the fest start date.
(function () {
  var root = document.getElementById("countdown");
  if (!root) return;
  var eventDateISO = (window.URJA_DATA && window.URJA_DATA.fest && window.URJA_DATA.fest.eventDate) || root.getAttribute("data-event-date");
  if (!eventDateISO) return;
  var target = new Date(eventDateISO).getTime();
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function render() {
    var diff = target - Date.now();
    var d = 0, h = 0, m = 0, s = 0;
    if (diff > 0) {
      d = Math.floor(diff / 86400000);
      h = Math.floor((diff / 3600000) % 24);
      m = Math.floor((diff / 60000) % 60);
      s = Math.floor((diff / 1000) % 60);
    }
    var dEl = document.getElementById("cd-days");
    var hEl = document.getElementById("cd-hours");
    var mEl = document.getElementById("cd-mins");
    var sEl = document.getElementById("cd-secs");
    if (dEl) dEl.textContent = pad(d);
    if (hEl) hEl.textContent = pad(h);
    if (mEl) mEl.textContent = pad(m);
    if (sEl) sEl.textContent = pad(s);
  }
  render();
  setInterval(render, 1000);
})();
