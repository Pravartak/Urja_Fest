"use client";

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'

type Event = {
  Id: number | string
  Title: string
  Description?: string
  Venue: string
  Date_and_Time: string
}

const dayLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4']

export default function Events() {
  const [eventsByDay, setEventsByDay] = useState<Record<string, Event[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchEvents() {
      try {
        const snapshots = await Promise.all(
          dayLabels.map((day) => getDocs(collection(db, day))),
        );
        const nextEvents = Object.fromEntries(
          snapshots.map((snapshot, index) => [
            dayLabels[index],
            snapshot.docs.map((eventDoc) => {
              const data = eventDoc.data() as Partial<Event>;
              return {
                Id: data.Id ?? eventDoc.id,
                Title: data.Title ?? 'Untitled event',
                Description: data.Description,
                Venue: data.Venue ?? 'Venue to be announced',
                Date_and_Time: data.Date_and_Time ?? 'Date to be announced',
              } satisfies Event;
            }),
          ]),
        );

        if (active) {
          setEventsByDay(nextEvents);
          setError(null);
        }
      } catch (fetchError) {
        console.error('[v0] Failed to fetch events from Firestore:', fetchError);
        if (active) setError('Events are currently unavailable. Please try again later.');
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchEvents();
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        <section className="events-hero">
          <h1 className="hero-title" data-text="Events">Events</h1>
          <p className="hero-tagline">Explore all the events taking place during URJA.</p>
        </section>

        <section className="section">
          {loading ? (
            <div className="event-day-empty">Loading events...</div>
          ) : error ? (
            <div className="event-day-empty">{error}</div>
          ) : (
            <div className="event-days">
              {dayLabels.map((day) => {
                const dayEvents = eventsByDay[day] ?? [];
                return (
                  <section key={day} className="event-day">
                    <h2 className="section-title">{day}</h2>
                    {dayEvents.length > 0 ? (
                      <div className="events-grid">
                        {dayEvents.map((event) => (
                          <article key={event.Id} className="event-card">
                            <h3>{event.Title}</h3>
                            {event.Description && <p>{event.Description}</p>}
                            <div className="event-meta">
                              <span>Date: {event.Date_and_Time}</span>
                              <span>Venue: {event.Venue}</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="event-day-empty">No events announced yet.</div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  )
}
