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
  bubble.textContent = text;

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

/*
const file = condFile.files[0];
    const fd = new FormData();
    // Check if the file is a PDF
    const isPDF = file.type === 'application/pdf';
    if (!isPDF) {
      alert('Please upload a PDF file.');
      return;
    }
    fd.append('file', file);
    response = await fetch('/condition', { method: 'POST', body: fd });
    // alert response
    const { ok } = await response.json();
    if (ok) {
      alert('Condition uploaded successfully.');
    } else {
      alert('Failed to upload condition.');
    }
      */

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
    const res = await fetch("http://your-server-address/api/upload", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    console.log("PDF upload result:", result);
  } catch (error) {
    console.error("Upload error:", error);
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
