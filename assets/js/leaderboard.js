// Renders the leaderboard on leaderboard.html from window.URJA_DATA.
(function () {
  var root = document.getElementById("lb-root");
  if (!root || !window.URJA_DATA) return;
  var board = (window.URJA_DATA.leaderboard || []).slice().sort(function (a, b) { return b.points - a.points; });
  if (board.length === 0) {
    root.innerHTML = '<div class="empty-state"><div class="icon">🪐</div><h3>No rankings yet</h3><p>Points will appear here once the admin updates the leaderboard.</p></div>';
    return;
  }
  var max = board[0].points || 1;
  var html = "";
  if (board.length >= 1) {
    html += '<div class="podium">';
    var podiumOrder = [board[1], board[0], board[2]].filter(Boolean);
    var medal = ["🥈", "🏆", "🥉"];
    podiumOrder.forEach(function (entry, i) {
      var isFirst = entry === board[0];
      html += '<div class="podium-card' + (isFirst ? " first" : "") + '">';
      html += '<div style="font-size:1.8rem;">' + medal[i] + '</div>';
      html += '<h3>' + entry.name + '</h3>';
      html += '<div class="pts">' + entry.points + '</div>';
      html += '<div style="color:var(--text-dim); font-size:0.8rem; letter-spacing:1px;">POINTS</div>';
      html += '</div>';
    });
    html += '</div>';
  }
  html += '<div class="lb-list">';
  board.forEach(function (entry, i) {
    var barWidth = Math.max(4, (entry.points / max) * 100);
    var rank = i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i + 1);
    html += '<div class="lb-row">';
    html += '<div class="lb-rank">' + rank + '</div>';
    html += '<div class="lb-bar-wrap">';
    html += '<div class="lb-name">' + entry.name + '</div>';
    html += '<div class="lb-bar" style="width:' + barWidth + '%;"></div>';
    html += '</div>';
    html += '<div class="lb-pts">' + entry.points + ' pts</div>';
    html += '</div>';
  });
  html += '</div>';
  root.innerHTML = html;
})();
