"use client";

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { db } from '@/lib/firebase'
import { collection } from 'firebase/firestore'
import { useEffect } from 'react'

type Event = {
  eventId: number
  title: string
  description?: string
  venue: string
  date: string
  time?: string
}

const day1Events: Event[] = [
  {
    eventId: 1,
    title: 'Literature Arts',
    description: 'A celebration of literary and artistic expression, featuring competitions and showcases.',
    venue: 'Bakliwal Foundation College',
    date: '10-26-2026',
    time: '11AM Onwards',
  },
  {
    eventId: 2,
    title: 'Fine Arts',
    description: 'An exhibition of visual arts, including painting, sculpture, and photography.',
    venue: 'Bakliwal Foundation College',
    date: '10-26-2026',
    time: '11AM Onwards',
  },
]

const day2Events: Event[] = [
  {
    eventId: 3,
    title: 'Solo Performances',
    description: 'A showcase of individual talents in music, dance, and drama.',
    venue: 'Bakliwal Foundation College',
    date: '10-26-2026',
    time: '11AM Onwards',
  },
  {
    eventId: 4,
    title: 'Band Performances',
    description: 'A series of live band performances featuring various genres of music.',
    venue: 'Bakliwal Foundation College',
    date: '10-26-2026',
    time: '11AM Onwards',
  },
]

const day3Events: Event[] = [
  {
    eventId: 5,
    title: 'Audition Videos',
    venue: 'Bakliwal Foundation College',
    date: '10-28-2026',
  },
]

const day4Events: Event[] = []

const eventDays = [
  { label: 'Day 1', events: day1Events },
  { label: 'Day 2', events: day2Events },
  { label: 'Day 3', events: day3Events },
  { label: 'Day 4', events: day4Events },
]

export default function Events() {
  useEffect(() => {
    const day1 = collection(db, "Day1");
  const day2 = collection(db, "Day2");
  const day3 = collection(db, "Day3");
  const day4 = collection(db, "Day4");
  });
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
          <div className="event-days">
            {eventDays.map((day) => (
              <section key={day.label} className="event-day">
                <h2 className="section-title">{day.label}</h2>
                {day.events.length > 0 ? (
                  <div className="events-grid">
                    {day.events.map((event) => (
                      <article key={event.eventId} className="event-card">
                        <h3>{event.title}</h3>
                        {event.description && <p>{event.description}</p>}
                        <div className="event-meta">
                          <span>Date: {event.date}</span>
                          <span>Venue: {event.venue}</span>
                          {event.time && <span>Time: {event.time}</span>}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="event-day-empty">Day 4 events will be announced soon.</div>
                )}
              </section>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
