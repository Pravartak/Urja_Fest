import { getLeaderboard } from '../../lib/data';
import { LeaderboardEntry } from '../../lib/types';

export default async function LeaderboardPage() {
  const leaderboard: LeaderboardEntry[] = await getLeaderboard();

  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.points - a.points);
  const podiumOrder = [sortedLeaderboard[1], sortedLeaderboard[0], sortedLeaderboard[2]].filter(Boolean) as LeaderboardEntry[];
  const maxPoints = sortedLeaderboard[0]?.points || 1;

  return (
    <div className="page-wrap" data-page="leaderboard">
      <section className="leaderboard-hero">
        <div className="eyebrow">📈 LIVE RANKINGS</div>
        <h1 className="section-title">🏆 LEADERBOARD</h1>
        <p className="lede" style={{ margin: '0 auto' }}>
          The ultimate clash of contingents. Track live PR points and discover the cosmic champion.
        </p>
      </section>

      <section className="section" style={{ paddingTop: '0' }}>
        {sortedLeaderboard.length > 0 ? (
          <>
            <div className="podium">
              {podiumOrder[0] && (
                <div className="podium-card">
                  <div style={{ fontSize: '1.8rem' }}>🥈</div>
                  <h3>{podiumOrder[0].name}</h3>
                  <div className="pts">{podiumOrder[0].points}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', letterSpacing: '1px' }}>POINTS</div>
                </div>
              )}
              {sortedLeaderboard[0] && (
                <div className="podium-card first">
                  <div style={{ fontSize: '1.8rem' }}>🏆</div>
                  <h3>{sortedLeaderboard[0].name}</h3>
                  <div className="pts">{sortedLeaderboard[0].points}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', letterSpacing: '1px' }}>POINTS</div>
                </div>
              )}
              {podiumOrder[2] && (
                <div className="podium-card">
                  <div style={{ fontSize: '1.8rem' }}>🥉</div>
                  <h3>{podiumOrder[2].name}</h3>
                  <div className="pts">{podiumOrder[2].points}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', letterSpacing: '1px' }}>POINTS</div>
                </div>
              )}
            </div>

            <div className="lb-list">
              {sortedLeaderboard.map((entry, index) => {
                const barWidth = Math.max(4, (entry.points / maxPoints) * 100);
                return (
                  <div className="lb-row" key={entry.name}>
                    <div className="lb-rank">
                      {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="lb-bar-wrap">
                      <div className="lb-name">{entry.name}</div>
                      <div className="lb-bar" style={{ width: `${barWidth}%` }} />
                    </div>
                    <div className="lb-pts">{entry.points} pts</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="icon">🪐</div>
            <h3>No rankings yet</h3>
            <p>Points will appear here once the admin updates the leaderboard.</p>
          </div>
        )}
      </section>
    </div>
  );
}