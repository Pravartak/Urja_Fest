"use client";

import { FormEvent, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { db } from "@/lib/firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

type CollegeCredential = {
  id: string;
  ClCode: string;
  CollegeName?: string;
  Name?: string;
};

type PendingRegistration = {
  id: string;
  collegeId: string;
  collegeName: string;
  eventName: string;
  teamLeaderName: string;
  paymentProof: string;
};

type AdminEvent = {
  id: string;
  name: string;
  day: string;
};

type PointAward = {
  label: string;
  points: number;
};

const pointAwards: PointAward[] = [
  { label: "First Place", points: 700 },
  { label: "Second Place", points: 300 },
  { label: "Third Place", points: 250 },
];

const mockRegistrations = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    contingent: "A",
    category: "Sports",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    contingent: "B",
    category: "Tech",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    contingent: "A",
    category: "Cultural",
  },
  {
    id: 4,
    name: "Sarah Williams",
    email: "sarah@example.com",
    contingent: "C",
    category: "Management",
  },
];

const eventDayCollections = ["Day1", "Day2", "Day3", "Day4"] as const;

export default function Admin() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [colleges, setColleges] = useState<CollegeCredential[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<
    PendingRegistration[]
  >([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<
    PendingRegistration[]
  >([]);
  const [processingRegistrationId, setProcessingRegistrationId] = useState<
    string | null
  >(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [pointEvent, setPointEvent] = useState("");
  const [pointTeamLeader, setPointTeamLeader] = useState("");
  const [pointPlace, setPointPlace] = useState("");
  const [pointStatus, setPointStatus] = useState("");
  const [isSavingPoints, setIsSavingPoints] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const initializeInfo = async () => {
      try {
        const [eventDaySnapshots, collegesSnapshot] = await Promise.all([
          Promise.all(
            eventDayCollections.map((day) => getDocs(collection(db, day))),
          ),
          getDocs(collection(db, "CollegeCreds")),
        ]);
        setEvents(
          eventDaySnapshots.flatMap((snapshot, dayIndex) =>
            snapshot.docs.map((eventDoc) => {
              const data = eventDoc.data();
              return {
                id: eventDoc.id,
                name: String(data.Name ?? data.name ?? "Untitled event"),
                day: eventDayCollections[dayIndex],
              };
            }),
          ),
        );
        setColleges(
          collegesSnapshot.docs.map(
            (collegeDoc) =>
              ({
                id: collegeDoc.id,
                ...collegeDoc.data(),
              }) as CollegeCredential,
          ),
        );
        const requestGroups = await Promise.all(
          collegesSnapshot.docs.map(async (collegeDoc) => {
            const collegeData = collegeDoc.data() as CollegeCredential;
            const requestsSnapshot = await getDocs(
              collection(doc(db, "CollegeCreds", collegeDoc.id), "Requests"),
            );
            return requestsSnapshot.docs.map((requestDoc) => {
              const request = requestDoc.data();
              return {
                id: requestDoc.id,
                collegeId: collegeDoc.id,
                collegeName:
                  request.collegeName ??
                  collegeData.CollegeName ??
                  collegeData.Name ??
                  collegeData.ClCode,
                eventName: request.selectedEvent ?? "Event not specified",
                teamLeaderName: request.fullName ?? "Name not specified",
                paymentProof:
                  request.paymentProofUrl ??
                  request.paymentProofFileName ??
                  "Not provided",
              };
            }) as PendingRegistration[];
          }),
        );
        const flattenedRegistrations = requestGroups.flat();
        setAllRegistrations(flattenedRegistrations);
        setPendingRegistrations(flattenedRegistrations);
      } catch (fetchError) {
        console.error("Failed to load admin data:", fetchError);
      }
    };
    initializeInfo();
  }, []);

  const handleRegistrationDecision = async (
    registration: PendingRegistration,
    decision: "accepted" | "rejected",
  ) => {
    setProcessingRegistrationId(registration.id);
    try {
      const requestRef = doc(
        db,
        "CollegeCreds",
        registration.collegeId,
        "Requests",
        registration.id,
      );
      const acceptedRef = collection(
        doc(db, "CollegeCreds", registration.collegeId),
        "Teams",
      );
      const collegeRef = doc(db, "CollegeCreds", registration.collegeId);
      await runTransaction(db, async (transaction) => {
        const requestSnapshot = await transaction.get(requestRef);
        if (!requestSnapshot.exists()) throw new Error("Request not found.");
        const currentRequest = requestSnapshot.data();
        if (currentRequest.status && currentRequest.status !== "pending") {
          throw new Error("Request has already been reviewed.");
        }

        if (decision === "accepted") {
          const collegeSnapshot = await transaction.get(collegeRef);
          if (!collegeSnapshot.exists()) throw new Error("College not found.");
          const collegeData = collegeSnapshot.data();
          const currentPoints = Number(
            collegeData.PRPoints ??
              collegeData.prPoints ??
              collegeData.Points ??
              collegeData.points ??
              0,
          );
          transaction.update(collegeRef, { PRPoints: currentPoints + 50 });
          transaction.update(collegeRef, { Teams: arrayUnion(requestRef.id) });
          await addDoc(acceptedRef, requestRef);
        }

        transaction.update(requestRef, {
          status: decision,
          reviewedAt: serverTimestamp(),
        });
      });
      setPendingRegistrations((current) =>
        current.filter((item) => item.id !== registration.id),
      );
    } catch (decisionError) {
      console.error("Failed to review registration:", decisionError);
      setPointStatus(
        "Could not update the registration. Check Firestore permissions and try again.",
      );
    } finally {
      setProcessingRegistrationId(null);
    }
  };

  const selectedAward = pointAwards.find((award) => award.label === pointPlace);
  const selectedEvent = events.find(
    (event) => `${event.day}:${event.id}` === pointEvent,
  );
  const teamOptions = allRegistrations.filter(
    (registration) =>
      registration.collegeId === selectedCollegeId &&
      registration.eventName === selectedEvent?.name,
  );

  const handlePointsChange = async (event: FormEvent) => {
    event.preventDefault();
    const selectedCollege = colleges.find(
      (college) => college.id === selectedCollegeId,
    );
    if (
      !selectedCollege ||
      !selectedEvent ||
      !pointTeamLeader ||
      !selectedAward
    ) {
      setPointStatus("Select a college, event, team leader, and place.");
      return;
    }
    setIsSavingPoints(true);
    setPointStatus("");
    try {
      const collegeRef = doc(db, "CollegeCreds", selectedCollege.id);
      await runTransaction(db, async (transaction) => {
        const current = await transaction.get(collegeRef);
        if (!current.exists())
          throw new Error("College record no longer exists.");
        const currentData = current.data();
        const currentPoints = Number(
          currentData.PRPoints ??
            currentData.prPoints ??
            currentData.Points ??
            currentData.points ??
            0,
        );
        transaction.update(collegeRef, {
          PRPoints: currentPoints + selectedAward.points,
        });
      });
      await addDoc(collection(db, "prPointTransactions"), {
        collegeId: selectedCollege.id,
        collegeCode: selectedCollege.ClCode.toUpperCase(),
        collegeName:
          selectedCollege.CollegeName ??
          selectedCollege.Name ??
          selectedCollege.ClCode,
        event: selectedEvent.name,
        teamLeader: pointTeamLeader,
        place: selectedAward.label,
        points: selectedAward.points,
        createdAt: serverTimestamp(),
      });
      setSelectedCollegeId("");
      setPointEvent("");
      setPointTeamLeader("");
      setPointPlace("");
      setPointStatus(
        `${selectedAward.points} PR Points added for ${selectedAward.label}.`,
      );
    } catch (saveError) {
      console.error("Failed to update PR Points:", saveError);
      setPointStatus(
        "Could not update PR Points. Check Firestore permissions and try again.",
      );
    } finally {
      setIsSavingPoints(false);
    }
  };

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsLoggedIn(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Invalid password");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword("");
    setErrorMsg("");
  };

  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        {!isLoggedIn ? (
          <section
            className="register-hero"
            style={{
              minHeight: "60vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                maxWidth: "420px",
                margin: "0 auto",
                width: "100%",
                padding: "0 24px",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <div
                  style={{
                    display: "flex",
                    height: "90px",
                    width: "90px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "9999px",
                    background:
                      "linear-gradient(135deg, var(--purple), var(--pink))",
                    fontSize: "2.2rem",
                    boxShadow: "0 0 60px rgba(232,69,184,0.35)",
                    margin: "0 auto 24px",
                  }}
                >
                  🔐
                </div>
                <h1 className="hero-title" style={{ fontSize: "2.2rem" }}>
                  Admin Panel
                </h1>
              </div>

              <form
                onSubmit={handleLogin}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "36px",
                }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      color: "var(--text-dim)",
                      fontSize: "0.75rem",
                      letterSpacing: "1.5px",
                    }}
                  >
                    ADMIN PASSWORD
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      color: "var(--text)",
                      padding: "14px 16px",
                      border: "1px solid var(--border)",
                      background: "rgba(0,0,0,0.3)",
                      fontSize: "0.95rem",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {errorMsg && (
                  <div
                    style={{
                      marginBottom: "20px",
                      background: "rgba(255, 100, 100, 0.1)",
                      border: "1px solid rgba(255, 100, 100, 0.5)",
                      borderRadius: "10px",
                      padding: "12px",
                      color: "#ff6464",
                      fontSize: "0.9rem",
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-purple-gradient"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Login
                </button>

                <p
                  style={{
                    marginTop: "24px",
                    color: "var(--text-dim)",
                    fontSize: "0.82rem",
                    textAlign: "center",
                  }}
                >
                  Hint: Use admin123
                </p>
              </form>
            </div>
          </section>
        ) : (
          <>
            <section className="section" style={{ marginTop: "80px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "40px",
                }}
              >
                <h1 className="hero-title" style={{ fontSize: "2rem" }}>
                  Dashboard
                </h1>
                <button onClick={handleLogout} className="btn btn-gold">
                  Logout
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "24px",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  marginBottom: "60px",
                }}
              >
                <div className="feature-card">
                  <div className="feature-icon">👥</div>
                  <h3>Total Registrations</h3>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "bold",
                      color: "var(--gold)",
                      marginTop: "10px",
                    }}
                  >
                    {mockRegistrations.length}
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📅</div>
                  <h3>Active Events</h3>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "bold",
                      color: "var(--gold)",
                      marginTop: "10px",
                    }}
                  >
                    {events.length}
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🏆</div>
                  <h3>Contingents</h3>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "bold",
                      color: "var(--gold)",
                      marginTop: "10px",
                    }}
                  >
                    4
                  </div>
                </div>
              </div>

              <section className="admin-points-panel">
                <div>
                  <p className="eyebrow">PR POINTS CONTROL</p>
                  <h2 className="basic-heading">Record a points transaction</h2>
                  <p className="admin-points-help">
                    Use a positive value to add points or a negative value to
                    deduct them. Every update appears in the college dashboard
                    history.
                  </p>
                </div>
                <form
                  className="admin-points-form"
                  onSubmit={handlePointsChange}
                >
                  <select
                    value={selectedCollegeId}
                    onChange={(event) => {
                      setSelectedCollegeId(event.target.value);
                      setPointEvent("");
                      setPointTeamLeader("");
                      setPointPlace("");
                    }}
                    required
                  >
                    <option value="">College</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.id}>
                        {college.CollegeName ?? college.Name ?? college.ClCode}{" "}
                        ({college.ClCode})
                      </option>
                    ))}
                  </select>
                  <select
                    value={pointEvent}
                    onChange={(event) => {
                      setPointEvent(event.target.value);
                      setPointTeamLeader("");
                      setPointPlace("");
                    }}
                    disabled={!selectedCollegeId}
                    required
                  >
                    <option value="">Event</option>
                    {events.map((event) => (
                      <option key={`${event.day}-${event.id}`} value={event.id}>
                        {event.name} ({event.day})
                      </option>
                    ))}
                  </select>
                  <select
                    value={pointTeamLeader}
                    onChange={(event) => setPointTeamLeader(event.target.value)}
                    disabled={!pointEvent || teamOptions.length === 0}
                    required
                  >
                    <option value="">Team Leader</option>
                    {teamOptions.map((team) => (
                      <option key={team.id} value={team.teamLeaderName}>
                        {team.teamLeaderName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={pointPlace}
                    onChange={(event) => setPointPlace(event.target.value)}
                    disabled={!pointTeamLeader}
                    required
                  >
                    <option value="">Place</option>
                    {pointAwards.map((award) => (
                      <option key={award.label} value={award.label}>
                        {award.label} — {award.points} points
                      </option>
                    ))}
                  </select>
                  {selectedAward && (
                    <div className="admin-award-summary">
                      <span>{selectedAward.label}</span>
                      <strong>+{selectedAward.points} PR</strong>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-purple-gradient"
                    disabled={isSavingPoints}
                  >
                    {isSavingPoints ? "Saving..." : "Update PR Points"}
                  </button>
                </form>
                {pointStatus && (
                  <p className="admin-points-status">{pointStatus}</p>
                )}

                <div style={{ marginTop: "32px" }}>
                  <h3 className="basic-heading" style={{ fontSize: "1.15rem" }}>
                    Pending Registrations
                  </h3>
                  {pendingRegistrations.length === 0 ? (
                    <p
                      className="admin-points-help"
                      style={{ marginTop: "14px" }}
                    >
                      No pending registrations.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gap: "14px",
                        marginTop: "18px",
                      }}
                    >
                      {pendingRegistrations.map((registration) => {
                        const isProcessing =
                          processingRegistrationId === registration.id;
                        const paymentProofIsUrl =
                          registration.paymentProof.startsWith("http");
                        return (
                          <div
                            key={`${registration.collegeId}-${registration.id}`}
                            style={{
                              border: "1px solid var(--border)",
                              borderRadius: "12px",
                              padding: "18px",
                              background: "rgba(0, 0, 0, 0.16)",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gap: "8px",
                                color: "var(--text-dim)",
                              }}
                            >
                              <div>
                                <strong style={{ color: "var(--text)" }}>
                                  Event:
                                </strong>{" "}
                                {registration.eventName}
                              </div>
                              <div>
                                <strong style={{ color: "var(--text)" }}>
                                  College:
                                </strong>{" "}
                                {registration.collegeName}
                              </div>
                              <div>
                                <strong style={{ color: "var(--text)" }}>
                                  Team Leader:
                                </strong>{" "}
                                {registration.teamLeaderName}
                              </div>
                              <div>
                                <strong style={{ color: "var(--text)" }}>
                                  Payment Proof:
                                </strong>{" "}
                                {paymentProofIsUrl ? (
                                  <a
                                    href={registration.paymentProof}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "var(--gold)" }}
                                  >
                                    View proof
                                  </a>
                                ) : (
                                  registration.paymentProof
                                )}
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                                marginTop: "16px",
                              }}
                            >
                              <button
                                type="button"
                                className="btn btn-gold"
                                disabled={isProcessing}
                                onClick={() =>
                                  handleRegistrationDecision(
                                    registration,
                                    "accepted",
                                  )
                                }
                              >
                                Accept and Add 50 Points
                              </button>
                              <button
                                type="button"
                                className="btn btn-purple-gradient"
                                disabled={isProcessing}
                                onClick={() =>
                                  handleRegistrationDecision(
                                    registration,
                                    "rejected",
                                  )
                                }
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <h2 className="basic-heading">Recent Registrations</h2>

              <div
                style={{
                  overflowX: "auto",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "18px",
                  marginTop: "30px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th
                        style={{
                          padding: "16px 24px",
                          textAlign: "left",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          letterSpacing: "1px",
                          color: "var(--text-dim)",
                        }}
                      >
                        NAME
                      </th>
                      <th
                        style={{
                          padding: "16px 24px",
                          textAlign: "left",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          letterSpacing: "1px",
                          color: "var(--text-dim)",
                        }}
                      >
                        EMAIL
                      </th>
                      <th
                        style={{
                          padding: "16px 24px",
                          textAlign: "left",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          letterSpacing: "1px",
                          color: "var(--text-dim)",
                        }}
                      >
                        CONTINGENT
                      </th>
                      <th
                        style={{
                          padding: "16px 24px",
                          textAlign: "left",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          letterSpacing: "1px",
                          color: "var(--text-dim)",
                        }}
                      >
                        CATEGORY
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRegistrations.map((reg) => (
                      <tr
                        key={reg.id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td
                          style={{
                            padding: "14px 24px",
                            color: "var(--text)",
                          }}
                        >
                          {reg.name}
                        </td>
                        <td
                          style={{
                            padding: "14px 24px",
                            color: "var(--text-dim)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {reg.email}
                        </td>
                        <td style={{ padding: "14px 24px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              background: "rgba(232,194,106,0.15)",
                              color: "var(--gold)",
                              padding: "4px 12px",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                            }}
                          >
                            {reg.contingent}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "14px 24px",
                            color: "var(--text-dim)",
                          }}
                        >
                          {reg.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
