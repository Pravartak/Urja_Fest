"use client";

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'

type Event = {
  Id: number
  Title: string
  Description?: string
  Venue: string
  Date_and_Time: string
}

const day1Events: Event[] = [
  {
    Id: 1,
    Title: 'Literature Arts',
    Description: 'A celebration of literary and artistic expression, featuring competitions and showcases.',
    Venue: 'Bakliwal Foundation College',
    Date_and_Time: '10-26-2026',
  },
  {
    Id: 2,
    Title: 'Fine Arts',
    Description: 'An exhibition of visual arts, including painting, sculpture, and photography.',
    Venue: 'Bakliwal Foundation College',
    Date_and_Time: '10-26-2026',
  },
]

const day2Events: Event[] = [
  {
    Id: 3,
    Title: 'Solo Performances',
    Description: 'A showcase of individual talents in music, dance, and drama.',
    Venue: 'Bakliwal Foundation College',
    Date_and_Time: '10-26-2026',
  },
  {
    Id: 4,
    Title: 'Band Performances',
    Description: 'A series of live band performances featuring various genres of music.',
    Venue: 'Bakliwal Foundation College',
    Date_and_Time: '10-26-2026',
  },
]

const day3Events: Event[] = [
  {
    Id: 5,
    Title: 'Audition Videos',
    Venue: 'Bakliwal Foundation College',
    Date_and_Time: '10-28-2026',
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
  const [day1Events, setDay1Events] = useState<Event | null>(null);
  const [day2Events, setDay2Events] = useState<Event | null>(null);
  const [day3Events, setDay3Events] = useState<Event | null>(null);
  const [day4Events, setDay4Events] = useState<Event | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      let fetchedDay1: Event[] = [];
      let fetchedDay2: Event[] = [];
      let fetchedDay3: Event[] = [];
      let fetchedDay4: Event[] = [];

      const day1 = collection(db, "Day1");
      const day2 = collection(db, "Day2");
      const day3 = collection(db, "Day3");
      const day4 = collection(db, "Day4");

      const day1Snap = await getDocs(day1);
      const day2Snap = await getDocs(day2);
      const day3Snap = await getDocs(day3);
      const day4Snap = await getDocs(day4);

      fetchedDay1 = day1Snap.docs.map((doc) => ({...doc.data})) as Event[];
      fetchedDay2 = day2Snap.docs.map((doc) => ({...doc.data})) as Event[];
      fetchedDay3 = day3Snap.docs.map((doc) => ({...doc.data})) as Event[];
      fetchedDay4 = day4Snap.docs.map((doc) => ({...doc.data})) as Event[];

      // setDay1Events(fetchedDay1);
    }
    fetchEvents();
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
                      <article key={event.Id} className="event-card">
                        <h3>{event.Title}</h3>
                        {event.Description && <p>{event.Description}</p>}
                        <div className="event-meta">
                          <span>Date: {event.Date_and_Time}</span>
                          <span>Venue: {event.Venue}</span>
                          {event.Date_and_Time && <span>Time: {event.Date_and_Time}</span>}
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
