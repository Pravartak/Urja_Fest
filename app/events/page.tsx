"use client";

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'

type Event = {
  Id: number | string
  Name: string
  Description?: string
  Venue: string
  Date_and_Time: string
}

type FirestoreEvent = Partial<Omit<Event, 'Date_and_Time'>> & {
  Date_and_Time?: unknown
  Date?: unknown
}

// The display labels include spaces, but the Firestore collections are named
// Day1 through Day4. Keep the two values separate so changing the UI label
// cannot accidentally change the collection being queried.
const eventDays = [
  { label: 'Day 1', collectionName: 'Day1' },
  { label: 'Day 2', collectionName: 'Day2' },
  { label: 'Day 3', collectionName: 'Day3' },
  { label: 'Day 4', collectionName: 'Day4' },
] as const

function formatEventDateTime(value: unknown): string {
  if (typeof value === 'string') return value

  const timestamp = value as {
    toDate?: () => Date
    seconds?: number
    nanoseconds?: number
  } | null

  let date: Date | undefined
  if (timestamp?.toDate) {
    date = timestamp.toDate()
  } else if (typeof timestamp?.seconds === 'number') {
    date = new Date(timestamp.seconds * 1_000)
  } else if (value instanceof Date) {
    date = value
  }

  if (!date || Number.isNaN(date.getTime())) return 'Date to be announced'

  const dateOnly = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
  return date.toLocaleString(
    'en-IN',
    dateOnly
      ? { dateStyle: 'medium' }
      : { dateStyle: 'medium', timeStyle: 'short' },
  )
}

export default function Events() {
  const [eventsByDay, setEventsByDay] = useState<Record<string, Event[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchEvents() {
      try {
        const snapshots = await Promise.all(
          eventDays.map(({ collectionName }) => getDocs(collection(db, collectionName))),
        );
        const nextEvents = Object.fromEntries(
          snapshots.map((snapshot, index) => [
            eventDays[index].label,
            snapshot.docs.map((eventDoc) => {
              const data = eventDoc.data() as FirestoreEvent;
              return {
                Id: data.Id ?? eventDoc.id,
                Name: data.Name ?? 'Untitled event',
                Description: data.Description,
                Venue: data.Venue ?? 'Venue to be announced',
                Date_and_Time: formatEventDateTime(data.Date_and_Time ?? data.Date),
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
              {eventDays.map(({ label: day }) => {
                const dayEvents = eventsByDay[day] ?? [];
                return (
                  <section key={day} className="event-day">
                    <h2 className="section-title">{day}</h2>
                    {dayEvents.length > 0 ? (
                      <div className="events-grid">
                        {dayEvents.map((event) => (
                          <article key={event.Id} className="event-card">
                            <h3>{event.Name}</h3>
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
