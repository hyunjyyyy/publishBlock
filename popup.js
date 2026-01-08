document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('publisherInput');
  const addBtn = document.getElementById('addBtn');
  const list = document.getElementById('blockList');

  // 1. 저장된 리스트 불러오기
  loadList();

  // 2. 추가 버튼 클릭 이벤트
  addBtn.addEventListener('click', () => {
    const publisher = input.value.trim();
    if (!publisher) return;

    chrome.storage.sync.get(['blockedPublishers'], (result) => {
      const blocked = result.blockedPublishers || [];
      if (!blocked.includes(publisher)) {
        blocked.push(publisher);
        chrome.storage.sync.set({ blockedPublishers: blocked }, () => {
          input.value = '';
          loadList(); // 리스트 갱신
        });
      }
    });
  });

  // 리스트 렌더링 함수
  function loadList() {
    chrome.storage.sync.get(['blockedPublishers'], (result) => {
      const blocked = result.blockedPublishers || [];
      list.innerHTML = '';
      blocked.forEach(pub => {
        const li = document.createElement('li');
        li.innerHTML = `${pub} <span class="del">X</span>`;
        // 삭제 기능
        li.querySelector('.del').addEventListener('click', () => {
          const newBlocked = blocked.filter(t => t !== pub);
          chrome.storage.sync.set({ blockedPublishers: newBlocked }, loadList);
        });
        list.appendChild(li);
      });
    });
  }
});