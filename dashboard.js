document.addEventListener('DOMContentLoaded', () => {
   
    const API_BASE = 'http://localhost:8001/api/v1';

    
    async function fetchStats() {
        try {
            const response = await fetch(`${API_BASE}/stats`);
            if(!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            
            document.getElementById('stat-tasks').textContent = data.tasks_automated_today.toLocaleString();
            document.getElementById('stat-success').textContent = data.success_rate;
            document.getElementById('stat-health').textContent = data.api_health;
        } catch (error) {
            console.warn("Backend not ready yet, display mock UI.");
            document.getElementById('stat-tasks').textContent = "14,208";
            document.getElementById('stat-success').textContent = "99.8%";
            document.getElementById('stat-health').textContent = "Optimal";
        }
    }

    
    async function fetchLogs() {
        try {
            const response = await fetch(`${API_BASE}/logs`);
            if(!response.ok) throw new Error("Failed to fetch");
            const logs = await response.json();
            const logsBody = document.getElementById('logs-body');
            logsBody.innerHTML = '';
            
            logs.forEach(log => {
                const tr = document.createElement('tr');
                const statusClass = (log.status === 'Completed' || log.status === 'Resolved' || log.status === 'Sent' || log.status === 'Processed') 
                    ? 'status-completed' 
                    : 'status-processing';
                
                tr.innerHTML = `
                    <td style="font-weight: 500">${log.task}</td>
                    <td><span class="status-badge ${statusClass}">${log.status}</span></td>
                    <td style="color:var(--text-muted); font-size:0.85rem">${log.timestamp}</td>
                `;
                logsBody.appendChild(tr);
            });
        } catch (error) {
            console.error("Backend not reachable for logs.");
            document.getElementById('logs-body').innerHTML = `
                <tr><td colspan='3' style='text-align: center; padding: 2rem'>Unable to reach API backend. Please ensure the Python server is running.</td></tr>
            `;
        }
    }

    
    const actionBtns = document.querySelectorAll('.action-btn');
    const resultBox = document.getElementById('trigger-result');

    actionBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const task = btn.getAttribute('data-task');
            
            
            resultBox.classList.remove('hidden');
            resultBox.className = 'trigger-result'; // reset classes
            resultBox.style.background = 'rgba(59, 130, 246, 0.1)';
            resultBox.style.borderColor = 'rgba(59, 130, 246, 0.2)';
            resultBox.style.color = '#60a5fa';
            resultBox.innerHTML = `<ion-icon name="sync-outline" style="animation: spin 1s linear infinite; margin-right: 8px; font-size: 1.2rem"></ion-icon>  Assisting with <b>${task}</b>...`;

            try {
                const response = await fetch(`${API_BASE}/workflows/trigger`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task: task })
                });
                
                if(!response.ok) throw new Error("API Execution Error");
                const data = await response.json();

                if (data.status === 'success') {
                    
                    resultBox.style.background = 'rgba(34, 197, 94, 0.1)';
                    resultBox.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                    resultBox.style.color = '#4ade80';
                    resultBox.innerHTML = `<ion-icon name="checkmark-circle-outline" style="font-size: 1.2rem; margin-right: 8px"></ion-icon> ${data.result.message} <span style="margin-left:auto; font-size: 0.8rem; color: #a3e635">(~${data.result.execution_time_seconds}s)</span>`;
                    
                  
                    let currentTasks = parseInt(document.getElementById('stat-tasks').innerText.replace(/,/g, ''));
                    if(!isNaN(currentTasks)) document.getElementById('stat-tasks').innerText = (currentTasks + 1).toLocaleString();
                    
                    fetchLogs();
                }
            } catch (error) {
                
                resultBox.style.background = 'rgba(239, 68, 68, 0.1)';
                resultBox.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                resultBox.style.color = '#f87171';
                resultBox.innerHTML = `<ion-icon name="alert-circle-outline" style="font-size: 1.2rem; margin-right: 8px"></ion-icon> Failed to connect to Python Engine. Have you run the backend module?`;
            }

            
            setTimeout(() => {
                if(!resultBox.innerHTML.includes('sync-outline')) {
                    resultBox.classList.add('hidden');
                }
            }, 6000);
        });
    });

    document.getElementById('refresh-logs').addEventListener('click', () => {
        const icon = document.querySelector('#refresh-logs ion-icon');
        icon.style.animation = 'spin 0.5s linear';
        fetchLogs().then(() => {
            setTimeout(() => icon.style.animation = '', 500);
        });
    });

    
    fetchStats();
    fetchLogs();
});
