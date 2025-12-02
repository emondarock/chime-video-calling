import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration
} from "amazon-chime-sdk-js";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chimeAPI } from '../utils/api';

const MeetingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [apiBaseUrl] = useState(
    "https://chime-video-calling-production.up.railway.app"
  );

  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [currentAttendee, setCurrentAttendee] = useState(null);
  const [isLocalVideoOn, setIsLocalVideoOn] = useState(false);
  const [logText, setLogText] = useState("");
  const [statusOnline, setStatusOnline] = useState(false);
  const [statusText, setStatusText] = useState("Disconnected");
  const [meetingDetails, setMeetingDetails] = useState("");
  const [joinMeetingIdInput, setJoinMeetingIdInput] = useState("");
  const [joinName, setJoinName] = useState(user?.email || "");
  const [createUserId, setCreateUserId] = useState(user?.email || "");
  const [joinUserId, setJoinUserId] = useState(user?.email || "");

  // Video tiles: [{ tileId, isLocal, label }]
  const [videoTiles, setVideoTiles] = useState([]);

  // Refs for Chime objects (not in state to avoid re-renders)
  const meetingSessionRef = useRef(null);
  const audioVideoRef = useRef(null);
  const videoRefs = useRef({}); // tileId -> HTMLVideoElement

  const appendLog = useCallback((message, data) => {
    const time = new Date().toISOString();
    let line = `[${time}] ${message}`;
    if (data !== undefined) {
      line += `\n${JSON.stringify(data, null, 2)}`;
    }
    line += "\n\n";
    setLogText(prev => line + prev);
  }, []);

  const setStatus = useCallback((online, text) => {
    setStatusOnline(online);
    setStatusText(text || (online ? "In meeting" : "Disconnected"));
  }, []);

  const getCurrentMeetingId = useCallback(() => {
    if (!currentMeeting) return null;
    return (
      currentMeeting.MeetingId ||
      (currentMeeting.Meeting && currentMeeting.Meeting.MeetingId) ||
      currentMeeting.meetingId
    );
  }, [currentMeeting]);

  // Bind video elements whenever tiles or audioVideo changes
  useEffect(() => {
    const audioVideo = audioVideoRef.current;
    if (!audioVideo) return;
    videoTiles.forEach(tile => {
      const el = videoRefs.current[tile.tileId];
      if (el) {
        audioVideo.bindVideoElement(tile.tileId, el);
      }
    });
  }, [videoTiles]);

  const leaveMeeting = useCallback(async () => {
    const audioVideo = audioVideoRef.current;
    if (audioVideo) {
      try {
        await audioVideo.stopAudioInput();
        await audioVideo.stopVideoInput();
        audioVideo.stopLocalVideoTile();
        audioVideo.stop();
      } catch (e) {
        console.error(e);
      }
    }

    meetingSessionRef.current = null;
    audioVideoRef.current = null;

    setIsLocalVideoOn(false);
    setVideoTiles([]);
    setStatus(false, "Disconnected");
    appendLog("Left meeting");
  }, [appendLog, setStatus]);

  async function requestMediaPermissions() {
    try {
      try {
        const camStatus = await navigator.permissions.query({ name: "camera" });
        if (camStatus.state === "denied") {
          alert("Camera access is blocked in browser settings. Please enable it in Settings → Site Permissions.");
          return false;
        }
      } catch (err) { }

      try {
        const micStatus = await navigator.permissions.query({ name: "microphone" });
        if (micStatus.state === "denied") {
          alert("Microphone access is blocked in browser settings. Please enable it in Settings → Site Permissions.");
          return false;
        }
      } catch (err) { }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMic = devices.some(device => device.kind === 'audioinput');
      await navigator.mediaDevices.getUserMedia({ video: true, audio: hasMic });
      return true;
    } catch (err) {
      console.error("Permissions denied:", err);
      alert("Please allow access to your camera and microphone.");
      return false;
    }
  }

  const startChimeSession = useCallback(
    async (meeting, attendee, displayName) => {
      try {
        const normalizedMeeting = meeting.Meeting || meeting;
        const normalizedAttendee = attendee.Attendee || attendee;

        appendLog("Starting Chime session", {
          meetingId: normalizedMeeting.MeetingId,
          attendeeId: normalizedAttendee.AttendeeId,
          displayName
        });

        const logger = new ConsoleLogger("ChimeMeetingLogs", LogLevel.INFO);
        const deviceController = new DefaultDeviceController(logger);
        const configuration = new MeetingSessionConfiguration(
          normalizedMeeting,
          normalizedAttendee
        );

        const meetingSession = new DefaultMeetingSession(
          configuration,
          logger,
          deviceController
        );

        const audioVideo = meetingSession.audioVideo;
        meetingSessionRef.current = meetingSession;
        audioVideoRef.current = audioVideo;

        const audioElement = document.getElementById("meetingAudio");
        if (audioElement) {
          audioVideo.bindAudioElement(audioElement);
        }

        const audioInputs = await audioVideo.listAudioInputDevices();
        if (audioInputs.length > 0) {
          const audioDeviceId = audioInputs[0].deviceId;
          await audioVideo.startAudioInput(audioDeviceId);
        }

        const videoInputs = await audioVideo.listVideoInputDevices();
        if (videoInputs.length > 0) {
          const videoDeviceId = videoInputs[0].deviceId;
          await audioVideo.startVideoInput(videoDeviceId);
        }

        audioVideo.addObserver({
          videoTileDidUpdate: tileState => {
            if (!tileState.boundAttendeeId || tileState.isContent) return;
            const tileId = tileState.tileId;
            const isLocal = tileState.localTile;
            const label = isLocal
              ? displayName || "You"
              : tileState.boundExternalUserId || "Guest";

            setVideoTiles(prev => {
              if (prev.find(t => t.tileId === tileId)) return prev;
              return [...prev, { tileId, isLocal, label }];
            });
          },
          videoTileWasRemoved: tileId => {
            setVideoTiles(prev => prev.filter(t => t.tileId !== tileId));
            const av = audioVideoRef.current;
            const el = videoRefs.current[tileId];
            if (av && el) {
              try {
                av.unbindVideoElement(tileId);
              } catch (e) {
                console.error(e);
              }
            }
            delete videoRefs.current[tileId];
          }
        });

        audioVideo.start();
        await audioVideo.startLocalVideoTile();
        setIsLocalVideoOn(true);
        setStatus(true, "In meeting");
        appendLog("Meeting session started");
      } catch (err) {
        console.error(err);
        appendLog("Error starting Chime session", { error: err.message });
        alert("Error starting Chime session: " + err.message);
        setStatus(false, "Disconnected");
      }
    },
    [appendLog, setStatus]
  );

  const handleCreateAndJoin = async () => {
    try {
      const allowed = await requestMediaPermissions();
      if (!allowed) return;

      const userId = createUserId.trim() || undefined;
      const response = await chimeAPI.createMeeting(userId);
      const data = response.data;

      const meeting = data.Meeting || data.meeting || data;
      let attendee = (data.Attendees && data.Attendees[0]) || data.attendee || null;

      setCurrentMeeting(meeting);
      const meetingId = meeting.MeetingId || (meeting.Meeting && meeting.Meeting.MeetingId);
      setMeetingDetails(`Current MeetingId: ${meetingId}`);
      setJoinMeetingIdInput(meetingId || "");

      if (!attendee) {
        const addRes = await chimeAPI.addAttendee(meetingId, userId);
        attendee = addRes.data.Attendee || (addRes.data.Attendees && addRes.data.Attendees[0]) || addRes.data;
      }

      setCurrentAttendee(attendee);
      await startChimeSession(meeting, attendee, "Host");
    } catch (err) {
      console.error(err);
      appendLog("Error creating/joining meeting", { error: err.message });
      alert("Error creating/joining meeting: " + err.message);
    }
  };

  const handleJoinExisting = async () => {
    const allowed = await requestMediaPermissions();
    if (!allowed) return;

    const meetingId = joinMeetingIdInput.trim();
    const displayName = joinName.trim() || "Guest";
    const userId = joinUserId.trim() || undefined;

    if (!meetingId) {
      alert("Please enter a MeetingId");
      return;
    }

    try {
      const [meetingRes, attendeeRes] = await Promise.all([
        chimeAPI.getMeeting(meetingId),
        chimeAPI.addAttendee(meetingId, userId)
      ]);

      const meeting = meetingRes.data.Meeting || meetingRes.data.meeting || meetingRes.data;
      const attendee = attendeeRes.data.Attendee || (attendeeRes.data.Attendees && attendeeRes.data.Attendees[0]) || attendeeRes.data;

      setCurrentMeeting(meeting);
      setCurrentAttendee(attendee);
      setMeetingDetails(`Current MeetingId: ${meetingId}`);
      await startChimeSession(meeting, attendee, displayName);
    } catch (err) {
      console.error(err);
      appendLog("Error joining existing meeting", { error: err.message });
      alert("Error joining existing meeting: " + err.message);
    }
  };

  const handleListAttendees = async () => {
    try {
      const meetingId = getCurrentMeetingId();
      if (!meetingId) {
        alert("No current meeting");
        return;
      }
      const res = await chimeAPI.listAttendees(meetingId);
      alert("Check log for attendees list");
      appendLog("Attendees list", res.data);
    } catch (err) {
      console.error(err);
      appendLog("Error listing attendees", { error: err.message });
    }
  };

  const handleStartTranscription = async () => {
    try {
      const meetingId = getCurrentMeetingId();
      if (!meetingId) {
        alert("No current meeting");
        return;
      }
      const res = await chimeAPI.startTranscription(meetingId);
      alert("Transcription started (check log)");
      appendLog("Start transcription response", res.data);
    } catch (err) {
      console.error(err);
      appendLog("Error starting transcription", { error: err.message });
    }
  };

  const handleStopTranscription = async () => {
    try {
      const meetingId = getCurrentMeetingId();
      if (!meetingId) {
        alert("No current meeting");
        return;
      }
      const res = await chimeAPI.stopTranscription(meetingId);
      alert("Transcription stopped (check log)");
      appendLog("Stop transcription response", res.data);
    } catch (err) {
      console.error(err);
      appendLog("Error stopping transcription", { error: err.message });
    }
  };

  const handleDeleteMeeting = async () => {
    if (!window.confirm("Delete the current meeting? This will end it for everyone.")) return;

    try {
      const meetingId = getCurrentMeetingId();
      if (!meetingId) {
        alert("No current meeting");
        return;
      }
      const res = await chimeAPI.deleteMeeting(meetingId);
      appendLog("Delete meeting response", res.data);
      alert("Meeting deleted");
      leaveMeeting();
      setCurrentMeeting(null);
      setCurrentAttendee(null);
      setMeetingDetails("");
      setJoinMeetingIdInput("");
    } catch (err) {
      console.error(err);
      appendLog("Error deleting meeting", { error: err.message });
    }
  };

  const handleToggleVideo = async () => {
    const audioVideo = audioVideoRef.current;
    if (!audioVideo) {
      alert("Not in a meeting");
      return;
    }
    try {
      if (!isLocalVideoOn) {
        await audioVideo.startLocalVideoTile();
        setIsLocalVideoOn(true);
        appendLog("Local video started");
      } else {
        audioVideo.stopLocalVideoTile();
        setIsLocalVideoOn(false);
        appendLog("Local video stopped");
      }
    } catch (err) {
      console.error(err);
      appendLog("Error toggling video", { error: err.message });
    }
  };

  const handleLeave = () => {
    leaveMeeting();
  };

  const handleBackToDashboard = () => {
    if (statusOnline) {
      if (window.confirm("You are currently in a meeting. Leave and go back to dashboard?")) {
        leaveMeeting();
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    if (statusOnline) {
      if (window.confirm("You are currently in a meeting. Leave meeting and logout?")) {
        leaveMeeting();
        logout();
        navigate('/login');
      }
    } else {
      logout();
      navigate('/login');
    }
  };

  const registerVideoRef = (tileId) => (el) => {
    if (el) {
      videoRefs.current[tileId] = el;
    } else {
      delete videoRefs.current[tileId];
    }
  };

  const styles = {
    body: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      margin: 0,
      padding: 0,
      background: "#0f172a",
      color: "#e5e7eb",
      minHeight: "100vh"
    },
    header: {
      background: "#111827",
      padding: "12px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      borderBottom: "1px solid #1f2937"
    },
    headerDesktop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 24px"
    },
    headerTitle: {
      margin: 0,
      fontSize: 16
    },
    main: {
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      maxWidth: "100%",
      boxSizing: "border-box"
    },
    mainDesktop: {
      padding: "16px 24px 32px",
      display: "grid",
      gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr)",
      gap: "16px",
      maxWidth: "1400px",
      margin: "0 auto"
    },
    card: {
      background: "#111827",
      borderRadius: "12px",
      padding: "14px",
      border: "1px solid #1f2937",
      boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
      boxSizing: "border-box"
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px"
    },
    badgeOnline: {
      background: "#022c22",
      color: "#6ee7b7"
    },
    badgeOffline: {
      background: "#1f2937",
      color: "#9ca3af"
    },
    log: {
      background: "#020617",
      color: "#e5e7eb",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "10px",
      maxHeight: "200px",
      overflow: "auto",
      whiteSpace: "pre-wrap",
      border: "1px solid #1f2937",
      WebkitOverflowScrolling: "touch"
    },
    videoTile: {
      position: "relative",
      background: "#020617",
      borderRadius: "8px",
      overflow: "hidden",
      border: "1px solid #1f2937",
      minHeight: "140px"
    },
    videoLabel: {
      position: "absolute",
      left: "8px",
      bottom: "8px",
      background: "rgba(15,23,42,0.9)",
      color: "#e5e7eb",
      fontSize: "12px",
      padding: "4px 10px",
      borderRadius: "999px",
      fontWeight: "500"
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      fontSize: 14,
      borderRadius: 8,
      border: "1px solid #374151",
      background: "#020617",
      color: "#e5e7eb",
      boxSizing: "border-box",
      WebkitAppearance: "none",
      minHeight: "44px"
    },
    button: {
      border: "none",
      borderRadius: 999,
      padding: "10px 16px",
      fontSize: 14,
      cursor: "pointer",
      marginRight: 6,
      marginTop: 8,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      minHeight: "44px",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent"
    },
    buttonPrimary: {
      background: "#10b981",
      color: "white"
    },
    buttonSecondary: {
      background: "#1f2937",
      color: "#e5e7eb"
    },
    buttonDanger: {
      background: "#ef4444",
      color: "white"
    },
    buttonFullWidth: {
      width: "100%",
      justifyContent: "center",
      marginRight: 0
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={styles.body}>
      <header style={{ ...styles.header, ...(isMobile ? {} : styles.headerDesktop) }}>
        <div>
          <h1 style={styles.headerTitle}>Chime SDK Meeting Demo</h1>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            <span style={{ ...styles.badge, ...(statusOnline ? styles.badgeOnline : styles.badgeOffline) }}>
              {statusText}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBackToDashboard}
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              marginTop: 0
            }}
          >
            ← Dashboard
          </button>
          <button
            onClick={handleLogout}
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              marginTop: 0
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={isMobile ? styles.main : styles.mainDesktop}>
        <section style={styles.card}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Meeting Controls</h2>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
              API Base URL: {apiBaseUrl}
            </label>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #1f2937", margin: "14px 0" }} />

          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
            Create new meeting (host) & auto join
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
              User ID (optional)
            </label>
            <input
              type="text"
              placeholder="Enter your user ID"
              value={createUserId}
              onChange={e => setCreateUserId(e.target.value)}
              style={styles.input}
            />
          </div>
          <button
            onClick={handleCreateAndJoin}
            style={{
              ...styles.button,
              ...styles.buttonPrimary,
              ...(isMobile ? styles.buttonFullWidth : {})
            }}
          >
            Create meeting & join
          </button>

          <div style={{ fontSize: 12, marginTop: 4, color: "#9ca3af", wordBreak: "break-all" }}>
            {meetingDetails}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #1f2937", margin: "14px 0" }} />

          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
            Join existing meeting
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                Meeting ID
              </label>
              <input
                type="text"
                placeholder="895c4373-e615-44b9..."
                value={joinMeetingIdInput}
                onChange={e => setJoinMeetingIdInput(e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                User ID (optional)
              </label>
              <input
                type="text"
                placeholder="Enter your user ID"
                value={joinUserId}
                onChange={e => setJoinUserId(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <button
            onClick={handleJoinExisting}
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              ...(isMobile ? styles.buttonFullWidth : {})
            }}
          >
            Join existing meeting
          </button>

          <hr style={{ border: "none", borderTop: "1px solid #1f2937", margin: "14px 0" }} />

          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
            Meeting utilities
          </div>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: isMobile ? 0 : 0 }}>
            <button onClick={handleListAttendees} style={{ ...styles.button, ...styles.buttonSecondary, ...(isMobile ? styles.buttonFullWidth : {}) }}>
              List attendees
            </button>
            <button onClick={handleStartTranscription} style={{ ...styles.button, ...styles.buttonSecondary, ...(isMobile ? styles.buttonFullWidth : {}) }}>
              Start transcription
            </button>
            <button onClick={handleStopTranscription} style={{ ...styles.button, ...styles.buttonSecondary, ...(isMobile ? styles.buttonFullWidth : {}) }}>
              Stop transcription
            </button>
            <button onClick={handleDeleteMeeting} style={{ ...styles.button, ...styles.buttonDanger, ...(isMobile ? styles.buttonFullWidth : {}) }}>
              Delete meeting
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Media & Debug Log</h2>

          <audio id="meetingAudio" style={{ display: "none" }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: isMobile ? 10 : 8,
              marginTop: 10,
              minHeight: isMobile ? 180 : 200
            }}
          >
            {videoTiles.map(tile => (
              <div key={tile.tileId} style={styles.videoTile}>
                <video
                  ref={registerVideoRef(tile.tileId)}
                  autoPlay
                  playsInline
                  muted={tile.isLocal}
                  style={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "16 / 9",
                    objectFit: "cover",
                    backgroundColor: "#000"
                  }}
                />
                <div style={styles.videoLabel}>
                  {tile.label || (tile.isLocal ? "You" : "Guest")}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 0 : 0 }}>
            <button onClick={handleToggleVideo} style={{ ...styles.button, ...styles.buttonSecondary, ...(isMobile ? styles.buttonFullWidth : {}) }}>
              {isLocalVideoOn ? "Turn off video" : "Turn on video"}
            </button>
            <button onClick={handleLeave} style={{ ...styles.button, ...styles.buttonSecondary, ...(isMobile ? styles.buttonFullWidth : {}) }}>
              Leave meeting
            </button>
          </div>

          <h3 style={{ fontSize: 13, marginTop: 14 }}>Log</h3>
          <pre style={styles.log}>{logText}</pre>
        </section>
      </main>
    </div>
  );
};

export default MeetingPage;
