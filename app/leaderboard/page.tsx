import { getLeaderboard } from '../../lib/data';
import { LeaderboardEntry } from '../../lib/types';

export default async function LeaderboardPage() {
  const leaderboard: LeaderboardEntry[] = await getLeaderboard();

  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.points - a.points);
  const podiumOrder = [sortedLeaderboard[1], sortedLeaderboard[0], sortedLeaderboard[2]].filter(Boolean) as LeaderboardEntry[];
  const maxPoints = sortedLeaderboard[0]?.points || 1;

  return (
    <>
      <div className="page-wrap">
        <section className="leaderboard-hero">
          <div className="eyebrow">📈 LIVE RANKINGS</div>
          <h1 className="hero-title">🏆 LEADERBOARD</h1>
          <p className="hero-tagline">
            The ultimate clash of contingents. Track live PR points and discover the cosmic champion.
          </p>
        </section>

        <section className="section">
          <div className="container">
            {sortedLeaderboard.length > 0 ? (
              <>
                <div className="podium">
                  {podiumOrder[0] && (
                    <div className="podium-box second">
                      <div className="medal">🥈</div>
                      <div className="podium-name">{podiumOrder[0].name}</div>
                      <div className="podium-points">{podiumOrder[0].points}</div>
                      <div className="podium-label">POINTS</div>
                    </div>
                  )}
                  {sortedLeaderboard[0] && (
                    <div className="podium-box first">
                      <div className="medal">🏆</div>
                      <div className="podium-name">{sortedLeaderboard[0].name}</div>
                      <div className="podium-points">{sortedLeaderboard[0].points}</div>
                      <div className="podium-label">POINTS</div>
                    </div>
                  )}
                  {podiumOrder[2] && (
                    <div className="podium-box third">
                      <div className="medal">🥉</div>
                      <div className="podium-name">{podiumOrder[2].name}</div>
                      <div className="podium-points">{podiumOrder[2].points}</div>
                      <div className="podium-label">POINTS</div>
                    </div>
                  )}
                </div>

                <div className="leaderboard-table">
                  {sortedLeaderboard.map((entry, index) => {
                    const barWidth = Math.max(4, (entry.points / maxPoints) * 100);
                    return (
                      <div key={index} className="leaderboard-row">
                        <div className="rank">
                          {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div className="name">
                          <div className="name-text">{entry.name}</div>
                        </div>
                        <div className="bar-container">
                          <div className="bar" style={{ width: `${barWidth}%` }}></div>
                        </div>
                        <div className="points">
                          <span>{entry.points} pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🪐</div>
                <div className="empty-title">No rankings yet</div>
                <div className="empty-message">
                  Points will appear here once the admin updates the leaderboard.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
