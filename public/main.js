async function sendCondition() {
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
  }
  
  async function getPlan() {
    const res = await fetch('/plan', { method: 'POST' });
    const { plan } = await res.json();
    document.getElementById('plan').textContent = plan;
  }
  
  async function critique() {
    const file = vid.files[0];
    const fd = new FormData();
    fd.append('video', file);
    const res = await fetch('/critique', { method: 'POST', body: fd });
    const { critique } = await res.json();
    document.getElementById('critique').textContent = critique;
  }
  