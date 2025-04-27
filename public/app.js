const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const fileInput = document.getElementById("file-input");
const messagesDiv = document.getElementById("messages");
const menuButton = document.getElementById("menu-button");
const headerOptions = document.getElementById("header-options");
const sidebar = document.getElementById("sidebar");
const app = document.getElementById("app");

// 모바일: ☰ 누르면 메뉴 열기
menuButton.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});

// 데스크탑: ⋮ 누르면 메뉴 열기
headerOptions.addEventListener("click", () => {
  if (window.innerWidth >= 769) {
    sidebar.classList.toggle("show");
    app.classList.toggle("menu-open");
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  const file = fileInput.files[0];

  if (!text && !file) return;

  appendDateLabelIfNeeded();

  if (text) {
    appendMessage("user", text);
    sendMessageToServer(text);
    messageInput.value = "";
  }

  if (file) {
    appendVideo("user", URL.createObjectURL(file));
    // if the file is a PDF, upload it to the server
    if (file.type === "application/pdf") {
      await uploadPDFToServer(file);
      appendMessage("server", "PDF uploaded successfully.");
      switchToVideoActions(); // 비디오 버튼 보여줌
    } else if (file.type.startsWith("video/")) {
      await uploadVideoToServer(file);
      appendMessage("server", "Video uploaded successfully.");
    } else {
      alert("Please upload a valid PDF or video file.");
      return;
    }
    fileInput.value = "";
  }
});

function appendMessage(sender, text) {
  const row = document.createElement("div");
  row.className = `message-row ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.innerHTML = marked.parse(text); // << 여기 수정 (markdown 파싱)

  row.appendChild(bubble);

  messagesDiv.appendChild(row);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


function appendVideo(sender, videoUrl) {
  const row = document.createElement("div");
  row.className = `message-row ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const video = document.createElement("video");
  video.src = videoUrl;
  video.controls = true;
  video.width = 200;

  bubble.appendChild(video);
  row.appendChild(bubble);

  messagesDiv.appendChild(row);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function appendDateLabelIfNeeded() {
  if (!messagesDiv.querySelector(".date-label")) {
    const dateLabel = document.createElement("div");
    dateLabel.className = "date-label";
    dateLabel.textContent = "Today";
    messagesDiv.appendChild(dateLabel);
  }
}

async function sendMessageToServer(text) {

    // send message to server
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("data", data);
      appendMessage("server", data.reply);
    } catch (error) {
      console.error("Error:", error);
      appendMessage("server", "Error: " + error.message);
    }
}

// upload pdf to server
async function uploadPDFToServer(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  try {
    const res = await fetch("/condition", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    console.log("PDF upload result:", result);
    appendMessage("server", result.reply);
  } catch (error) {
    console.error("Upload error:", error);
    appendMessage("server", "Error: " + error.message);
  }
}

async function uploadVideoToServer(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://your-server-address/api/upload", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    console.log("video upload result:", result);

    if (result.analysis) {
      appendMessage("server", result.analysis);
    }
  } catch (error) {
    console.error("Upload error:", error);
    appendMessage("server", "Error analyzing video");
  }
}


const messages = document.getElementById('messages');

function addMessage(markdownText, isBot = false) {
  const messageElement = document.createElement('div');
  messageElement.className = isBot ? 'bot-message' : 'user-message';
  messageElement.innerHTML = marked.parse(markdownText); // <-- 여기 핵심!
  messages.appendChild(messageElement);
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    appendMessage("server", "Hello, Welcome to [App Name], your personalized partner in recovery and beyond.\nWe're here to empower your journey to full strength — one step at a time.");

    setTimeout(() => {
      appendMessage("server", "Before we get started, please upload your physical therapy prescription.\nThis ensures that your care plan is perfectly tailored to your specific needs, guided by your healthcare provider's expert recommendation.");
    }, 1500); // Hello 뜬 후 1.5초 후
  }, 700); // 페이지 열리고 0.5초 후 Hello

  // switchToVideoActions();
}); 


function switchToVideoActions() {
  document.getElementById('chat-form').style.display = 'none'; // 입력창 숨김
  document.getElementById('video-action-buttons').style.display = 'flex'; // 비디오 버튼 보여줌
}

// 비디오 모달 관련
const takeVideoButton = document.getElementById('take-video-button');
const videoModal = document.getElementById('video-modal');
const cameraPreview = document.getElementById('camera-preview');
const closeModalButton = document.getElementById('close-modal-button');
const startRecordButton = document.getElementById('start-record-button');
const stopRecordButton = document.getElementById('stop-record-button');

let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];

// Take Video 버튼 클릭 → 모달 열고 카메라 켜기
takeVideoButton.addEventListener('click', () => {
  videoModal.style.display = 'flex';
  const poseDemoFrame = document.getElementById('pose-demo-frame');
  poseDemoFrame.src = '/pose-demo.html'; // ✅ 경로 중요
});


// Start Recording 버튼 클릭
startRecordButton.addEventListener('click', () => {
  if (mediaStream) {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.start();
    startRecordButton.disabled = true;
    stopRecordButton.disabled = false;
  }
});

// Stop Recording 버튼 클릭
stopRecordButton.addEventListener('click', () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
    startRecordButton.disabled = false;
    stopRecordButton.disabled = true;
  }
});

// Close 버튼 클릭 → 모달 닫고 카메라 끄기
closeModalButton.addEventListener('click', () => {
  videoModal.style.display = 'none';

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
    cameraPreview.srcObject = null;
  }
});

// 오늘 날짜 표시 추가 (맨 위에)
function insertTodayLabel() {
  const dateLabel = document.createElement('div');
  dateLabel.className = 'date-label';
  
  // 날짜 + 시간 넣기 (ex. Today, 9:45 AM)
  const now = new Date();
  const options = { hour: 'numeric', minute: 'numeric', hour12: true };
  const formattedTime = now.toLocaleTimeString([], options);
  
  dateLabel.textContent = `Today, ${formattedTime}`;
  
  messagesDiv.appendChild(dateLabel);
}

// 페이지 로드할 때 Today 삽입
insertTodayLabel();

