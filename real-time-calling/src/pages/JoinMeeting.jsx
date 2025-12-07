import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration
} from 'amazon-chime-sdk-js';
import { appointmentAPI } from '../utils/api';
import { getMeetingTokenFromUrl } from '../utils/queryParams';
import './JoinMeeting.css';

const JoinMeeting = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, error, ready, joining, connected
  const [errorMessage, setErrorMessage] = useState('');
  const [appointmentData, setAppointmentData] = useState(null);
  const [meetingData, setMeetingData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLocalVideoOn, setIsLocalVideoOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoTiles, setVideoTiles] = useState([]);

  const meetingSessionRef = useRef(null);
  const audioVideoRef = useRef(null);
  const videoRefs = useRef({});

  // Validate token and fetch meeting details
  useEffect(() => {
    const validateAndFetchMeeting = async () => {
      const token = getMeetingTokenFromUrl();

      if (!token) {
        setStatus('error');
        setErrorMessage('No meeting token provided. Please check your invitation link.');
        return;
      }

      try {
        const response = await appointmentAPI.checkMeeting(token);
        const data = response.data;

        if (!data.valid) {
          setStatus('error');
          setErrorMessage(data.message || 'You cannot join this meeting at this time.');
          return;
        }

        // Backend returns Meeting and Attendee directly in response
        setMeetingData({
          Meeting: data.Meeting,
          Attendee: data.Attendee
        });
        setAppointmentData(data.decoded)
        console.log('✅ User validated and ready to join:', {
          attendeeId: data.Attendee?.AttendeeId,
          meetingId: data.Meeting?.MeetingId,
          externalUserId: data.Attendee?.ExternalUserId
        });
        setStatus('ready');
      } catch (error) {
        console.error('Error validating meeting token:', error);
        setStatus('error');
        setErrorMessage(
          JSON.stringify(error)
        );
      }
    };

    validateAndFetchMeeting();
  }, []);

  // Bind video elements
  useEffect(() => {
    const audioVideo = audioVideoRef.current;
    if (!audioVideo) return;

    videoTiles.forEach(tile => {
      const el = videoRefs.current[tile.tileId];
      if (el) {
        console.log(`🔗 Binding video element for tile ${tile.tileId}`);
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
        console.error('Error leaving meeting:', e);
      }
    }

    meetingSessionRef.current = null;
    audioVideoRef.current = null;
    setIsLocalVideoOn(false);
    setVideoTiles([]);
    setStatus('ready');
  }, []);

  const requestMediaPermissions = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMic = devices.some(device => device.kind === 'audioinput');
      await navigator.mediaDevices.getUserMedia({ video: true, audio: hasMic });
      return true;
    } catch (err) {
      console.error('Permissions denied:', err);
      alert('Please allow access to your camera and microphone to join the meeting.');
      return false;
    }
  };

  const startChimeSession = useCallback(async () => {
    if (!meetingData) return;

    const allowed = await requestMediaPermissions();
    if (!allowed) return;

    setStatus('joining');

    try {
      const normalizedMeeting = meetingData.Meeting || meetingData;
      const normalizedAttendee = meetingData.Attendee || meetingData.attendee;

      const logger = new ConsoleLogger('ChimeMeetingLogs', LogLevel.WARN);
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

      const audioElement = document.getElementById('meetingAudio');
      if (audioElement) {
        console.log('🔊 Binding audio element');
        audioVideo.bindAudioElement(audioElement);
      } else {
        console.error('❌ Audio element not found');
      }

      const audioInputs = await audioVideo.listAudioInputDevices();
      console.log('🎤 Available audio inputs:', audioInputs.length);
      if (audioInputs.length > 0) {
        const audioDeviceId = audioInputs[0].deviceId;
        console.log('🎤 Starting audio input with device:', audioDeviceId);
        await audioVideo.startAudioInput(audioDeviceId);
      } else {
        console.warn('⚠️ No audio input devices found');
      }

      const videoInputs = await audioVideo.listVideoInputDevices();
      if (videoInputs.length > 0) {
        const videoDeviceId = videoInputs[0].deviceId;
        console.log('Starting video input with device:', videoDeviceId);
        await audioVideo.startVideoInput(videoDeviceId);
      }

      console.log('📡 Adding observer for video tile updates');
      audioVideo.addObserver({
        videoTileDidUpdate: tileState => {
          console.log('Video tile updated:', tileState);
          if (!tileState.boundAttendeeId || tileState.isContent) return;
          const tileId = tileState.tileId;
          const isLocal = tileState.localTile;
          const label = isLocal
            ? appointmentData?.patient_name || 'You'
            : appointmentData?.doctor_name || 'Guest';

          setVideoTiles(prev => {
            if (prev.find(t => t.tileId === tileId)) return prev;
            console.log(`👤 ${isLocal ? 'Local user' : 'Remote participant'} video tile added:`, {
              tileId,
              attendeeId: tileState.boundAttendeeId,
              label,
              timestamp: new Date().toISOString()
            });
            return [...prev, { tileId, isLocal, label }];
          });
        },
        videoTileWasRemoved: tileId => {
          console.log('🚪 videoTileWasRemoved triggered for tileId:', tileId);
          const removedTile = videoTiles.find(t => t.tileId === tileId);
          if (removedTile) {
            console.log('👋 Participant left:', {
              tileId,
              label: removedTile.label,
              isLocal: removedTile.isLocal,
              timestamp: new Date().toISOString()
            });
          }
          setVideoTiles(prev => prev.filter(t => t.tileId !== tileId));
          delete videoRefs.current[tileId];
        }
      });

      audioVideo.start();
      await audioVideo.startLocalVideoTile();
      setIsLocalVideoOn(true);
      console.log('🎥 User joined meeting successfully:', {
        attendeeId: normalizedAttendee?.AttendeeId,
        externalUserId: normalizedAttendee?.ExternalUserId,
        meetingId: normalizedMeeting?.MeetingId,
        timestamp: new Date().toISOString()
      });
      setStatus('connected');
    } catch (err) {
      console.error('Error starting Chime session:', err);
      setStatus('error');
      setErrorMessage('Failed to join the meeting. Please try again.');
    }
  }, [meetingData, appointmentData]);

  const handleToggleVideo = async () => {
    const audioVideo = audioVideoRef.current;
    if (!audioVideo) return;

    try {
      if (!isLocalVideoOn) {
        await audioVideo.startLocalVideoTile();
        setIsLocalVideoOn(true);
      } else {
        audioVideo.stopLocalVideoTile();
        setIsLocalVideoOn(false);
      }
    } catch (err) {
      console.error('Error toggling video:', err);
    }
  };

  const handleToggleMute = async () => {
    const audioVideo = audioVideoRef.current;
    if (!audioVideo) return;

    try {
      if (isMuted) {
        console.log('🎤 Unmuting microphone');
        audioVideo.realtimeUnmuteLocalAudio();
        setIsMuted(false);
      } else {
        console.log('🔇 Muting microphone');
        audioVideo.realtimeMuteLocalAudio();
        setIsMuted(true);
      }
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  const handleLeave = () => {
    if (window.confirm('Leave the meeting?')) {
      leaveMeeting();
      navigate('/dashboard');
    }
  };

  const registerVideoRef = (tileId) => (el) => {
    if (el) {
      videoRefs.current[tileId] = el;
    } else {
      delete videoRefs.current[tileId];
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (status === 'loading') {
    return (
      <>
        <audio id="meetingAudio" autoPlay style={{ display: 'none' }} />
        <div className="join-meeting-container">
          <div className="join-meeting-card">
            <div className="loading-spinner"></div>
            <h2>Validating your meeting invitation...</h2>
            <p>Please wait a moment</p>
          </div>
        </div>
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <audio id="meetingAudio" autoPlay style={{ display: 'none' }} />
        <div className="join-meeting-container">
          <div className="join-meeting-card error">
            <div className="error-icon">⚠️</div>
            <h2>Unable to Join Meeting</h2>
            <p className="error-text">{errorMessage}</p>

            {appointmentData && (
              <div className="appointment-info">
                <h3>Appointment Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Patient:</span>
                    <span className="value">{appointmentData.patient_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Doctor:</span>
                    <span className="value">{appointmentData.doctor_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Date & Time:</span>
                    <span className="value">{formatDateTime(appointmentData.appointment_time)}</span>
                  </div>
                  {timeRemaining !== null && timeRemaining > 0 && (
                    <div className="info-item">
                      <span className="label">Available in:</span>
                      <span className="value">{formatTime(timeRemaining)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={() => navigate('/dashboard')} className="back-button">
              Go to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  if (status === 'ready') {
    return (
      <>
        <audio id="meetingAudio" autoPlay style={{ display: 'none' }} />
        <div className="join-meeting-container">
          <div className="join-meeting-card ready">
            <div className="success-icon">✓</div>
            <h2>Ready to Join Meeting</h2>
            <p>Your appointment is ready. Click below to join the video consultation.</p>

            <div className="appointment-info">
              <h3>Appointment Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{appointmentData?.isDoctor ? "Doctor" : "Patient"}</span>
                  <span className="value">{appointmentData?.patient_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Doctor:</span>
                  <span className="value">{appointmentData?.doctor_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Date & Time:</span>
                  <span className="value">{formatDateTime(appointmentData?.appointment_time)}</span>
                </div>
                {appointmentData?.package_info?.name && (
                  <div className="info-item">
                    <span className="label">Package:</span>
                    <span className="value">{appointmentData.package_info.name}</span>
                  </div>
                )}
              </div>
            </div>

            <button onClick={startChimeSession} className="join-button">
              Join Meeting Now
            </button>
            <button onClick={() => navigate('/dashboard')} className="secondary-button">
              Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  if (status === 'joining') {
    return (
      <>
        <audio id="meetingAudio" autoPlay style={{ display: 'none' }} />
        <div className="join-meeting-container">
          <div className="join-meeting-card">
            <div className="loading-spinner"></div>
            <h2>Joining meeting...</h2>
            <p>Setting up your video and audio</p>
          </div>
        </div>
      </>
    );
  }

  // Connected to meeting
  return (
    <div className="meeting-view">
      <div className="meeting-header">
        <div className="meeting-info">
          <h2>Meeting with {appointmentData?.doctor_name || appointmentData?.patient_name}</h2>
          <span className="status-badge connected">Connected</span>
        </div>
        <button onClick={handleLeave} className="leave-button">
          Leave Meeting
        </button>
      </div>

      <audio id="meetingAudio" autoPlay style={{ display: 'none' }} />

      <div className="video-grid">
        {videoTiles.map(tile => (
          <div key={tile.tileId} className="video-tile">
            <video
              ref={registerVideoRef(tile.tileId)}
              autoPlay
              playsInline
              muted={tile.isLocal}
              className="video-element"
            />
            <div className="video-label">{tile.label}</div>
          </div>
        ))}
        {videoTiles.length === 0 && (
          <div className="no-video-message">
            <p>Waiting for participants...</p>
          </div>
        )}
      </div>

      <div className="meeting-controls">
        <button onClick={handleToggleMute} className="control-button">
          {isMuted ? '🔇 Unmute' : '🎤 Mute'}
        </button>
        <button onClick={handleToggleVideo} className="control-button">
          {isLocalVideoOn ? '📹 Turn Off Video' : '📹 Turn On Video'}
        </button>
      </div>
    </div>
  );
};

export default JoinMeeting;
