// API Base URL - Change this to your deployed API URL or keep for local testing
const API_BASE_URL = 'http://127.0.0.1:3000';

// Store current meeting and attendee data
let currentMeetingId = null;
let currentAttendees = [];

// Display response in the UI
function displayResponse(data, isError = false) {
  const responseDiv = document.getElementById('response');
  const className = isError ? 'error' : 'success';
  responseDiv.innerHTML = `<pre class="${className}">${JSON.stringify(data, null, 2)}</pre>`;
}

// Display loading state
function showLoading() {
  const responseDiv = document.getElementById('response');
  responseDiv.innerHTML = '<div class="loading"></div> Loading...';
}

// Update button states based on meeting state
function updateButtonStates() {
  const hasMeeting = currentMeetingId !== null;

  document.getElementById('deleteMeetingBtn').disabled = !hasMeeting;
  document.getElementById('addAttendeeBtn').disabled = !hasMeeting;
  document.getElementById('listAttendeesBtn').disabled = !hasMeeting;
  document.getElementById('getMeetingBtn').disabled = !hasMeeting;
  document.getElementById('startTranscriptionBtn').disabled = !hasMeeting;
  document.getElementById('stopTranscriptionBtn').disabled = !hasMeeting;
}

// Create Meeting
async function createMeeting() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/create-meeting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (response.ok) {
      currentMeetingId = data.Meeting.MeetingId;

      // Display meeting info
      document.getElementById('meetingInfo').style.display = 'block';
      document.getElementById('meetingId').textContent = currentMeetingId;
      document.getElementById('joinUrl').textContent = data.Meeting.MediaPlacement.AudioHostUrl;

      displayResponse(data);
      updateButtonStates();
    } else {
      displayResponse(data, true);
    }
  } catch (error) {
    displayResponse({ error: error.message }, true);
  }
}

// Add Attendee
async function addAttendee() {
  if (!currentMeetingId) {
    displayResponse({ error: 'No active meeting' }, true);
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/add-attendee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId: currentMeetingId
      })
    });

    const data = await response.json();

    if (response.ok) {
      displayResponse(data);
      // Refresh attendees list
      await listAttendees();
    } else {
      displayResponse(data, true);
    }
  } catch (error) {
    displayResponse({ error: error.message }, true);
  }
}

// Get Meeting Info
async function getMeeting() {
  if (!currentMeetingId) {
    displayResponse({ error: 'No active meeting' }, true);
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/get-meeting?meetingId=${currentMeetingId}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (response.ok) {
      displayResponse(data);
    } else {
      displayResponse(data, true);
    }
  } catch (error) {
    displayResponse({ error: error.message }, true);
  }
}

// List Attendees
async function listAttendees() {
  if (!currentMeetingId) {
    displayResponse({ error: 'No active meeting' }, true);
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/list-attendees?meetingId=${currentMeetingId}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (response.ok) {
      currentAttendees = data.Attendees || [];
      displayResponse(data);

      // Display attendees in the UI
      const attendeesList = document.getElementById('attendeesList');
      if (currentAttendees.length === 0) {
        attendeesList.innerHTML = '<p style="color: #999;">No attendees yet</p>';
      } else {
        attendeesList.innerHTML = currentAttendees.map(attendee => `
                    <div class="attendee-item">
                        <div>
                            <strong>Attendee ID:</strong> ${attendee.AttendeeId}<br>
                            <small>External User: ${attendee.ExternalUserId}</small>
                        </div>
                        <button onclick="deleteAttendee('${attendee.AttendeeId}')">Remove</button>
                    </div>
                `).join('');
      }
    } else {
      displayResponse(data, true);
    }
  } catch (error) {
    displayResponse({ error: error.message }, true);
  }
}

// Delete Attendee
async function deleteAttendee(attendeeId) {
  if (!currentMeetingId) {
    displayResponse({ error: 'No active meeting' }, true);
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/delete-attendee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId: currentMeetingId,
        attendeeId: attendeeId
      })
    });

    const data = await response.json();

    if (response.ok) {
      displayResponse(data);
      // Refresh attendees list
      await listAttendees();
    } else {
      displayResponse(data, true);
    }
  } catch (error) {
    displayResponse({ error: error.message }, true);
  }
}

// Delete Meeting
async function deleteMeeting() {
  if (!currentMeetingId) {
    displayResponse({ error: 'No active meeting' }, true);
    return;
  }

  if (!confirm('Are you sure you want to delete this meeting?')) {
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/delete-meeting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId: currentMeetingId
      })
    });

    const data = await response.json();

    if (response.ok) {
      currentMeetingId = null;
      currentAttendees = [];

      // Hide meeting info
      document.getElementById('meetingInfo').style.display = 'none';
      document.getElementById('attendeesList').innerHTML = '';

      displayResponse(data);
      updateButtonStates();
    } else {
      displayResponse(data, true);
    }
  } catch (error) {
    displayResponse({ error: error.message }, true);
  }
}

// Start Meeting Transcription
async function startTranscription() {
  if (!currentMeetingId) {
    displayResponse({ error: 'No active meeting' }, true);
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/start-meeting-transcription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId: currentMeetingId
      })
    });

    const data = await response.json();
    displayResponse(data, !response.ok);
  } catch (error) {
    displayResponse({ error: error.message }, true);
  }
}

// Stop Meeting Transcription
async function stopTranscription() {
  if (!currentMeetingId) {
    displayResponse({ error: 'No active meeting' }, true);
    return;
  }

  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/stop-meeting-transcription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId: currentMeetingId
      })
    });

    const data = await response.json();
    displayResponse(data, !response.ok);
  } catch (error) {
    displayResponse({ error: error.message }, true);
  }
}

// Initialize
updateButtonStates();
