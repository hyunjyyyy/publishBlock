// content.js - [v1.4.2] Yes24 오차단 완벽 방지 (제목 간섭 제거)

const IS_DEBUG = false;

const log = (...args) => {
    if (IS_DEBUG) console.log(...args);
};

log("[CleanBook] v1.4.2 로드됨");

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const SITE_CONFIG = {
  kyobo: {
    targetSelector: '.prod_publish, .prod_author, .publish, .author, .prod_info, .prodDt_info, .prodDt_detail span',
    color: '#474c98'
  },
  aladin: {
    itemSelector: '.ss_book_box, .v2_box_list, .ss_book_list > li',
    targetSelector: 'a[href*="PublisherSearch"], a[href*="AuthorSearch"]',
    color: '#eb3b94'
  },
  yes24: {
    // [FIX] 사용자 제보 구조 반영: 제목/소개글 등 불순물 클래스 전면 삭제
    // 오직 <span class="authPub info_auth"> 와 <span class="authPub info_pub"> 만 잡습니다.
    // (.goods_auth, .goods_pub은 타일형 뷰 호환성을 위해 남김 - 제목은 포함 안 함)
    targetSelector: '.info_auth, .info_pub, .goods_auth, .goods_pub, .authPub a',
    color: '#0089FF'
  }
};

const hostname = window.location.hostname;

if (hostname.includes('kyobobook.co.kr')) {
    kyoboInit();
} else if (hostname.includes('aladin.co.kr')) {
    aladinInit();
} else if (hostname.includes('yes24.com')) {
    yes24Init();
}

// ========================================================
// 1. 교보문고 (Kyobo)
// ========================================================
function kyoboInit() {
    log("[CleanBook] 교보문고 모듈 시작");
    const observer = new MutationObserver(() => runKyobo());
    runKyobo();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

function runKyobo() {
    browserAPI.storage.sync.get(['blockedPublishers'], (result) => {
        const blockedList = result.blockedPublishers || [];
        if (blockedList.length > 0) kyoboBlock(blockedList);
    });
}

function kyoboBlock(blockedList) {
    const targets = document.querySelectorAll(SITE_CONFIG.kyobo.targetSelector);

    targets.forEach(target => {
        if (target.dataset.checked) return;

        const text = target.innerText.trim();
        if (text.length < 1) return;

        const cleanText = text.replace(/\s+/g, ' ').toLowerCase();
        const matchedKeyword = blockedList.find(blocked => {
            if (!blocked) return false;
            const keyword = blocked.toLowerCase().trim();
            return keyword.length >= 1 && cleanText.includes(keyword);
        });

        if (matchedKeyword) {
            const container = target.closest('.prod_item') ||
                              target.closest('.prod_row') ||
                              target.closest('.prod_area') ||
                              target.closest('li') ||
                              target.closest('.prodDt_detail');

            if (container) {
                const finalContainer = container.classList.contains('prodDt_detail') ? container.parentElement : container;
                blockItem(finalContainer, matchedKeyword, SITE_CONFIG.kyobo.color);
            }
        }
        target.dataset.checked = "true";
    });
}

// ========================================================
// 2. 알라딘 (Aladin)
// ========================================================
function aladinInit() {
    log("[CleanBook] 알라딘 모듈 시작");
    const observer = new MutationObserver(() => runAladin());
    runAladin();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

function runAladin() {
    browserAPI.storage.sync.get(['blockedPublishers'], (result) => {
        const blockedList = result.blockedPublishers || [];
        if (blockedList.length > 0) aladinBlock(blockedList);
    });
}

function aladinBlock(blockedList) {
    const targets = document.querySelectorAll(SITE_CONFIG.aladin.targetSelector);

    targets.forEach(target => {
        if (target.dataset.checked) return;

        const text = target.innerText.trim();
        const cleanText = text.replace(/\s+/g, ' ').toLowerCase();

        const matchedKeyword = blockedList.find(blocked => {
            if (!blocked) return false;
            const keyword = blocked.toLowerCase().trim();
            return keyword.length >= 1 && cleanText.includes(keyword);
        });

        if (matchedKeyword) {
            const container = target.closest('.ss_book_box') ||
                              target.closest('.ss_book_list > li') ||
                              target.closest('.v2_box_item') ||
                              target.closest('div[id^="bg_"]');

            if (container) {
                blockItem(container, matchedKeyword, SITE_CONFIG.aladin.color);
            }
        }
        target.dataset.checked = "true";
    });
}

// ========================================================
// 3. 예스24 (Yes24) - 구조 변경 반영
// ========================================================
function yes24Init() {
    log("[CleanBook] Yes24 모듈 시작");
    const observer = new MutationObserver(() => runYes24());
    runYes24();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

function runYes24() {
    browserAPI.storage.sync.get(['blockedPublishers'], (result) => {
        const blockedList = result.blockedPublishers || [];
        if (blockedList.length > 0) yes24Block(blockedList);
    });
}

function yes24Block(blockedList) {
    const targets = document.querySelectorAll(SITE_CONFIG.yes24.targetSelector);

    targets.forEach(target => {
        if (target.dataset.checked) return;

        const text = target.innerText.trim();
        const cleanText = text.replace(/\s+/g, ' ').toLowerCase();
        const matchedKeyword = blockedList.find(blocked => {
            if (!blocked) return false;
            const keyword = blocked.toLowerCase().trim();
            return keyword.length >= 1 && cleanText.includes(keyword);
        });

        if (matchedKeyword) {
            // 범인(저자/출판사)을 찾았으니, 책 덩어리(Container)를 찾아 올라갑니다.
            const container = target.closest('li') || target.closest('tr') || target.closest('.goods_grp') || target.closest('div[class*="item"]');

            if (container) {
                blockItem(container, matchedKeyword, SITE_CONFIG.yes24.color);
            }
        }
        target.dataset.checked = "true";
    });
}

// ========================================================
// 공통 함수
// ========================================================

function blockItem(element, name, color) {
    if (element.querySelector('.cleanbook-overlay')) return;

    if (element.tagName.toLowerCase() === 'tr') {
        element.style.transform = 'scale(1)';
    } else {
        const style = window.getComputedStyle(element);
        if (style.position === 'static') {
            element.style.position = 'relative';
        }
    }

    const overlay = document.createElement('div');
    overlay.className = 'cleanbook-overlay';
    const finalColor = color || 'red';

    overlay.innerHTML = `
      <div style="
        background:white;
        border:2px solid ${finalColor};
        padding:10px;
        border-radius:6px;
        text-align:center;
        font-weight:bold;
        color:#333;
        font-size: 13px;
        width:90%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 1001;
        white-space: normal !important;
        line-height: 1.5 !important;
        word-break: keep-all !important;
      ">
        🚫 ${name}<br>
        <span style="font-size:11px; color:#999; font-weight:normal;">클릭하여 보기</span>
      </div>
    `;

    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.cursor = 'pointer';

    overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        overlay.remove();
        if (element.tagName.toLowerCase() === 'tr') {
            element.style.transform = '';
        }
    });

    element.appendChild(overlay);
}
