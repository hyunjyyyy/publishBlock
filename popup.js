document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('publisherInput');
  const addBtn = document.getElementById('addBtn');
  const list = document.getElementById('blockList');
  const searchInput = document.getElementById('searchInput');

  const githubLink = document.getElementById('githubLink');
  const donateToggleBtn = document.getElementById('donateToggleBtn');
  const qrContainer = document.getElementById('qrContainer');
  
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');

  loadList();

  addBtn.addEventListener('click', () => {
    const publisher = input.value.trim();
    if (!publisher) return;
    addPublisher(publisher);
  });

  input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addBtn.click();
  });

  searchInput.addEventListener('input', loadList);

  if (githubLink) {
      githubLink.addEventListener('click', () => {
          chrome.tabs.create({ url: 'https://github.com/hyunjyyyy/publishblock' });
      });
  }

  if (donateToggleBtn) {
      donateToggleBtn.addEventListener('click', () => {
          qrContainer.style.display = (qrContainer.style.display === 'block') ? 'none' : 'block';
      });
  }

  if (exportBtn) {
      exportBtn.addEventListener('click', () => {
          chrome.storage.sync.get(['blockedPublishers'], (result) => {
              const blocked = result.blockedPublishers || [];
              if (blocked.length === 0) {
                  alert('백업할 데이터가 없습니다.');
                  return;
              }
              
              const dataStr = JSON.stringify(blocked, null, 2);
              const blob = new Blob([dataStr], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              
              const a = document.createElement('a');
              a.href = url;
              a.download = `CleanBook_Backup_${new Date().toISOString().slice(0,10)}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
          });
      });
  }

  if (importBtn && importInput) {
      importBtn.addEventListener('click', () => {
          importInput.click();
      });

      importInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const importedData = JSON.parse(event.target.result);
                  
                  if (!Array.isArray(importedData)) {
                      alert('올바르지 않은 백업 파일입니다.');
                      return;
                  }

                  chrome.storage.sync.get(['blockedPublishers'], (result) => {
                      const currentBlocked = result.blockedPublishers || [];
                      const newSet = new Set([...currentBlocked, ...importedData]);
                      const mergedList = Array.from(newSet);

                      chrome.storage.sync.set({ blockedPublishers: mergedList }, () => {
                          alert(`복구 완료! 총 ${mergedList.length}개의 차단 목록이 설정되었습니다.`);
                          loadList();
                          importInput.value = '';
                      });
                  });

              } catch (err) {
                  alert('파일을 읽는 중 오류가 발생했습니다.');
                  console.error(err);
              }
          };
          reader.readAsText(file);
      });
  }


  function addPublisher(publisher) {
    chrome.storage.sync.get(['blockedPublishers'], (result) => {
      const blocked = result.blockedPublishers || [];
      if (!blocked.includes(publisher)) {
        blocked.push(publisher);
        chrome.storage.sync.set({ blockedPublishers: blocked }, () => {
          input.value = '';
          loadList();
        });
      } else {
        input.value = ''; 
      }
    });
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
  }

  function loadList() {
    chrome.storage.sync.get(['blockedPublishers'], (result) => {
      let blocked = result.blockedPublishers || [];
      
      blocked.sort((a, b) => a.localeCompare(b, 'ko'));

      const keyword = searchInput.value.trim();
      if (keyword) {
          blocked = blocked.filter(pub => pub.toLowerCase().includes(keyword.toLowerCase()));
      }

      list.innerHTML = '';
      
      if (blocked.length === 0) {
          const msg = keyword ? '검색 결과가 없습니다.' : '목록이 비어있습니다.';
          list.innerHTML = `<li style="justify-content:center; color:#999; background:none; box-shadow:none;">${msg}</li>`;
          return;
      }

      blocked.forEach(pub => {
        const li = document.createElement('li');
        
        let displayText = pub;
        if (keyword) {
            const safeKeyword = escapeRegExp(keyword);
            const regex = new RegExp(`(${safeKeyword})`, 'gi');
            displayText = pub.replace(regex, '<b style="color:#474c98;">$1</b>');
        }

        li.innerHTML = `<span>${displayText}</span> <span class="del">X</span>`;
        
        li.querySelector('.del').addEventListener('click', () => {
          chrome.storage.sync.get(['blockedPublishers'], (res) => {
              const currentList = res.blockedPublishers || [];
              const newList = currentList.filter(t => t !== pub);
              chrome.storage.sync.set({ blockedPublishers: newList }, loadList);
          });
        });
        list.appendChild(li);
      });
    });
  }
});