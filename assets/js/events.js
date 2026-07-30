// Renders the events grid on events.html from window.URJA_DATA.
(function () {
  var root = document.getElementById("events-root");
  if (!root || !window.URJA_DATA) return;
  var days = window.URJA_DATA.events;
  var html = "";
  Object.keys(days).forEach(function (day) {
    var list = days[day] || [];
    html += '<div class="day-section">';
    html += '<h2>📅 ' + day + '</h2>';
    html += '<div class="day-sub">' + list.length + ' event' + (list.length === 1 ? "" : "s") + '</div>';
    html += '<div class="events-grid">';
    list.forEach(function (ev) {
      html += '<div class="event-card">';
      html += '<span class="event-tag ' + ev.tag + '">' + ev.tag.toUpperCase() + '</span>';
      html += '<h3>' + ev.name + '</h3>';
      html += '<p>' + ev.desc + '</p>';
      html += '<div class="event-meta">';
      html += '<span>🕐 ' + ev.time + '</span>';
      html += '<span>📍 ' + ev.venue + '</span>';
      html += '<span>👥 ' + ev.team + '</span>';
      html += '<span>🏆 ' + ev.prize + '</span>';
      html += '</div>';
      html += '<span class="event-status ' + ev.status + '">' + (ev.status === "open" ? "Registration Open" : "Registration Closed") + '</span>';
      html += '</div>';
    });
    html += '</div></div>';
  });
  root.innerHTML = html;
})();
