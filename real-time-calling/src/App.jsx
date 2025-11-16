// App.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration
} from "amazon-chime-sdk-js";

const App = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:3000");

  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [currentAttendee, setCurrentAttendee] = useState(null);
  const [isLocalVideoOn, setIsLocalVideoOn] = useState(false);
  const [logText, setLogText] = useState("");
  const [statusOnline, setStatusOnline] = useState(false);
  const [statusText, setStatusText] = useState("Disconnected");
  const [meetingDetails, setMeetingDetails] = useState("");
  const [joinMeetingIdInput, setJoinMeetingIdInput] = useState("");
  const [joinName, setJoinName] = useState("");
  const [createUserId, setCreateUserId] = useState("");
  const [joinUserId, setJoinUserId] = useState("");

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

  // Helpers for API calls
  const apiPost = useCallback(
    async (path, body) => {
      const base = apiBaseUrl.trim().replace(/\/+$/, "");
      const url = base + path;
      appendLog(`POST ${url}`, body);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}"
      });
      const json = await res.json();
      appendLog(`Response ${res.status} ${url}`, json);
      if (!res.ok) {
        throw new Error(json.message || "Request failed");
      }
      return json;
    },
    [apiBaseUrl, appendLog]
  );

  const apiGet = useCallback(
    async (path, params = {}) => {
      const base = apiBaseUrl.trim().replace(/\/+$/, "");
      const qs = new URLSearchParams(params).toString();
      const url = base + path + (qs ? `?${qs}` : "");
      appendLog(`GET ${url}`);
      const res = await fetch(url);
      const json = await res.json();
      appendLog(`Response ${res.status} ${url}`, json);
      if (!res.ok) {
        throw new Error(json.message || "Request failed");
      }
      return json;
    },
    [apiBaseUrl, appendLog]
  );

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
        // v3 friendly cleanup
        if (typeof audioVideo.stopAudioInput === 'function') {
          await audioVideo.stopAudioInput();
        }
        if (typeof audioVideo.stopVideoInput === 'function') {
          await audioVideo.stopVideoInput();
        }

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
      // 1. Detect if camera is permanently blocked
      try {
        const camStatus = await navigator.permissions.query({ name: "camera" });
        if (camStatus.state === "denied") {
          alert(
            "Camera access is blocked in browser settings. Please enable it in Settings → Site Permissions."
          );
          return false;
        }
      } catch (err) {
        // Some browsers don't support permissions API → ignore
      }

      // 2. Detect if microphone is permanently blocked
      try {
        const micStatus = await navigator.permissions.query({ name: "microphone" });
        console.log('Microphone permission status:', micStatus.state);
        if (micStatus.state === "denied") {
          alert(
            "Microphone access is blocked in browser settings. Please enable it in Settings → Site Permissions."
          );
          return false;
        }
      } catch (err) { }

      //Check if microphone is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMic = devices.some(device => device.kind === 'audioinput');
      console.log('Microphone available:', hasMic);

      // 3. Normal permission request popup
      await navigator.mediaDevices.getUserMedia({ video: true, audio: hasMic });

      console.log("Permissions granted");
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

        const logger = new ConsoleLogger(
          "ChimeMeetingLogs",
          LogLevel.INFO
        );
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

        // Bind audio
        const audioElement = document.getElementById("meetingAudio");
        if (audioElement) {
          audioVideo.bindAudioElement(audioElement);
        }

        // Choose default devices
        // NEW (works for both v2 and v3)
        const audioInputs = await audioVideo.listAudioInputDevices();
        if (audioInputs.length > 0) {
          const audioDeviceId = audioInputs[0].deviceId;
          if (typeof audioVideo.startAudioInput === 'function') {
            // v3
            await audioVideo.startAudioInput(audioDeviceId);
          } else if (typeof audioVideo.chooseAudioInputDevice === 'function') {
            // v2 fallback
            await audioVideo.chooseAudioInputDevice(audioDeviceId);
          }
        }

        const videoInputs = await audioVideo.listVideoInputDevices();
        if (videoInputs.length > 0) {
          const videoDeviceId = videoInputs[0].deviceId;
          if (typeof audioVideo.startVideoInput === 'function') {
            // v3
            await audioVideo.startVideoInput(videoDeviceId);
          } else if (typeof audioVideo.chooseVideoInputDevice === 'function') {
            // v2 fallback
            await audioVideo.chooseVideoInputDevice(videoDeviceId);
          }
        }


        // Video observer
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

        // Start audio/video
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

  // Handlers

  const handleCreateAndJoin = async () => {
    try {
      const allowed = await requestMediaPermissions();
      if (!allowed) return;

      const userId = createUserId.trim() || undefined;
      const data = await apiPost("/create-meeting", userId ? { userId } : {});
      const meeting = data.Meeting || data.meeting || data;
      let attendee = (data.Attendees && data.Attendees[0]) || data.attendee || null;

      setCurrentMeeting(meeting);

      const meetingId =
        meeting.MeetingId || (meeting.Meeting && meeting.Meeting.MeetingId);
      setMeetingDetails(`Current MeetingId: ${meetingId}`);
      setJoinMeetingIdInput(meetingId || "");

      if (!attendee) {
        const addRes = await apiPost("/add-attendee", { meetingId, userId });
        attendee =
          addRes.Attendee ||
          (addRes.Attendees && addRes.Attendees[0]) ||
          addRes;
      }

      setCurrentAttendee(attendee);
      await startChimeSession(meeting, attendee, "Host")
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
        apiGet("/get-meeting", { meetingId }),
        apiPost("/add-attendee", { meetingId, userId })
      ]);

      const meeting = meetingRes.Meeting || meetingRes.meeting || meetingRes;
      const attendee =
        attendeeRes.Attendee ||
        (attendeeRes.Attendees && attendeeRes.Attendees[0]) ||
        attendeeRes;

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
      const res = await apiGet("/list-attendees", { meetingId });
      alert("Check log for attendees list");
      appendLog("Attendees list", res);
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
      const res = await apiPost("/start-meeting-transcription", { meetingId });
      alert("Transcription started (check log)");
      appendLog("Start transcription response", res);
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
      const res = await apiPost("/stop-meeting-transcription", { meetingId });
      alert("Transcription stopped (check log)");
      appendLog("Stop transcription response", res);
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
      const res = await apiPost("/delete-meeting", { meetingId });
      appendLog("Delete meeting response", res);
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

  const registerVideoRef = (tileId) => (el) => {
    if (el) {
      videoRefs.current[tileId] = el;
    } else {
      delete videoRefs.current[tileId];
    }
  };

  // Styles (copied from original HTML, adapted for React + Mobile optimized)
  const styles = {
    body: {
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
    headerSubtitle: {
      fontSize: 11,
      color: "#9ca3af",
      marginTop: 2
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

  // Detect mobile viewport
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
          <div id="status" style={{ fontSize: 13, marginTop: 4 }}>
            <span
              style={{
                ...styles.badge,
                ...(statusOnline ? styles.badgeOnline : styles.badgeOffline)
              }}
            >
              {statusText}
            </span>
          </div>
        </div>
        {!isMobile && (
          <div style={styles.headerSubtitle}>
            Frontend → API Gateway → Lambda → Chime SDK
          </div>
        )}
      </header>

      <main style={isMobile ? styles.main : styles.mainDesktop}>
        {/* LEFT: Controls */}
        <section style={styles.card}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>
            Backend &amp; Meeting Controls
          </h2>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            Configure API, create/join meetings, control transcription.
          </div>

          <div style={{ marginTop: 10 }}>
            <label htmlFor="apiBaseUrl" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
              API Base URL (without trailing slash)
            </label>
            <input
              type="text"
              id="apiBaseUrl"
              value={apiBaseUrl}
              onChange={e => setApiBaseUrl(e.target.value)}
              style={styles.input}
            />
            {!isMobile && (
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                Example:{" "}
                <code
                  style={{
                    background: "#020617",
                    padding: "2px 4px",
                    borderRadius: 4,
                    fontSize: 10,
                    border: "1px solid #1f2937"
                  }}
                >
                  https://abcd1234.execute-api.us-east-1.amazonaws.com/prod
                </code>
              </div>
            )}
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #1f2937",
              margin: "14px 0"
            }}
          />

          <div
            style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}
          >
            Create new meeting (host) &amp; auto join
          </div>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="createUserId" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
              User ID (optional)
            </label>
            <input
              type="text"
              id="createUserId"
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
            Create meeting &amp; join
          </button>

          <div
            id="meetingDetails"
            style={{
              fontSize: 12,
              marginTop: 4,
              color: "#9ca3af",
              wordBreak: "break-all"
            }}
          >
            {meetingDetails}
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #1f2937",
              margin: "14px 0"
            }}
          />

          <div
            style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}
          >
            Join existing meeting
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 8
            }}
          >
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 8 }}>
              <div style={{ flex: 1, minWidth: isMobile ? "100%" : 180 }}>
                <label htmlFor="joinMeetingId" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                  Meeting ID
                </label>
                <input
                  type="text"
                  id="joinMeetingId"
                  placeholder="895c4373-e615-44b9..."
                  value={joinMeetingIdInput}
                  onChange={e => setJoinMeetingIdInput(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ flex: 1, minWidth: isMobile ? "100%" : 180 }}>
                <label htmlFor="joinName" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  id="joinName"
                  placeholder="Your name (optional)"
                  value={joinName}
                  onChange={e => setJoinName(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
            <div>
              <label htmlFor="joinUserId" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                User ID (optional)
              </label>
              <input
                type="text"
                id="joinUserId"
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

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #1f2937",
              margin: "14px 0"
            }}
          />

          <div
            style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}
          >
            Meeting utilities (current meeting)
          </div>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: isMobile ? 0 : 0 }}>
            <button
              onClick={handleListAttendees}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isMobile ? styles.buttonFullWidth : {})
              }}
            >
              List attendees
            </button>
            <button
              onClick={handleStartTranscription}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isMobile ? styles.buttonFullWidth : {})
              }}
            >
              Start transcription
            </button>
            <button
              onClick={handleStopTranscription}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isMobile ? styles.buttonFullWidth : {})
              }}
            >
              Stop transcription
            </button>
            <button
              onClick={handleDeleteMeeting}
              style={{
                ...styles.button,
                ...styles.buttonDanger,
                ...(isMobile ? styles.buttonFullWidth : {})
              }}
            >
              Delete meeting
            </button>
          </div>
        </section>

        {/* RIGHT: Videos & Logs */}
        <section style={styles.card}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Media &amp; Debug Log</h2>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            Local/remote video tiles + HTTP/SDK logs.
          </div>

          <audio id="meetingAudio" style={{ display: "none" }} />

          <div
            id="video-container"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: isMobile ? 10 : 8,
              marginTop: 10,
              minHeight: isMobile ? 180 : 200
            }}
          >
            {videoTiles.map(tile => (
              <div
                key={tile.tileId}
                style={styles.videoTile}
                id={`video-tile-${tile.tileId}`}
              >
                <video
                  ref={registerVideoRef(tile.tileId)}
                  id={`video-${tile.tileId}`}
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
            <button
              onClick={handleToggleVideo}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isMobile ? styles.buttonFullWidth : {})
              }}
            >
              {isLocalVideoOn ? "Turn off video" : "Turn on video"}
            </button>
            <button
              onClick={handleLeave}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isMobile ? styles.buttonFullWidth : {})
              }}
            >
              Leave meeting
            </button>
          </div>

          <h3 style={{ fontSize: 13, marginTop: 14 }}>Log</h3>
          <pre id="log" style={styles.log}>
            {logText}
          </pre>
        </section>
      </main>
    </div>
  );
};

export default App;
