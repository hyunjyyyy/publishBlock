// content.js
const IS_DEBUG = false; // 차단이 안 될 때는 true로 켜서 콘솔을 확인하세요!

const log = (...args) => {
    if (IS_DEBUG) console.log(...args);
};

log("[CleanBook] 확장 프로그램 로드됨");

const SITE_CONFIG = {
  kyobo: {
    // [업데이트] eBook 전용 클래스 및 저자/출판사 영역 추가
    targetSelector: '.prod_publish, .prod_author, .publish, .author, .prod_info, .prodDt_info, .prodDt_detail span',
    color: '#474c98'
  },
  aladin: {
    itemSelector: '.ss_book_box, .v2_box_list, .ss_book_list > li',
    publisherLinkSelector: 'a[href*="PublisherSearch"], a[href*="AuthorSearch"]',
    color: '#eb3b94'
  },
  yes24: {
    targetSelector: '.goods_pub, .goods_auth, .goods_company, .goods_info, .info_pub, .authPub, .info_auth, .info_name',
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
// 1. 교보문고 (Kyobo) - Bottom-Up 방식으로 전면 개편
// ========================================================
function kyoboInit() {
    log("[CleanBook] 교보문고 모듈 시작 (Bottom-Up)");
    const observer = new MutationObserver(() => runKyobo());
    runKyobo();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

function runKyobo() {
    chrome.storage.sync.get(['blockedPublishers'], (result) => {
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
            // [핵심] 범인(target)으로부터 "책 한 권" 덩어리를 거슬러 올라가 찾습니다.
            // 일반 도서(li, .prod_item)와 eBook(.prod_area, .prodDt_detail의 부모 등)을 모두 대응
            const container = target.closest('.prod_item') || 
                              target.closest('.prod_row') || 
                              target.closest('.prod_area') || 
                              target.closest('li') ||
                              target.closest('.prodDt_detail'); // eBook 상세 대응

            if (container) {
                log(`🚫 [Kyobo] 차단됨: "${matchedKeyword}" (대상: ${text})`);
                blockItem(container, matchedKeyword, SITE_CONFIG.kyobo.color);
            }
        }
        target.dataset.checked = "true";
    });
}

// ========================================================
// 2. 알라딘 (Aladin) - 기존 로직 유지
// ========================================================
function aladinInit() {
    log("[CleanBook] 알라딘 모듈 시작");
    const observer = new MutationObserver(() => runAladin());
    runAladin();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

function runAladin() {
    chrome.storage.sync.get(['blockedPublishers'], (result) => {
        const blockedList = result.blockedPublishers || [];
        if (blockedList.length > 0) aladinUniversalBlock(blockedList);
    });
}

function aladinUniversalBlock(blockedList) {
    const items = document.querySelectorAll(SITE_CONFIG.aladin.itemSelector);
    items.forEach(item => {
        if (item.dataset.filtered) return;
        const publisherLink = item.querySelector(SITE_CONFIG.aladin.publisherLinkSelector);
        if (publisherLink) {
            checkAndBlock(item, publisherLink.innerText, blockedList, SITE_CONFIG.aladin.color, "Aladin");
        }
        item.dataset.filtered = "true";
    });
}

// ========================================================
// 3. 예스24 (Yes24) - Bottom-Up 방식 유지
// ========================================================
function yes24Init() {
    log("[CleanBook] Yes24 모듈 시작 (Bottom-Up)");
    const observer = new MutationObserver(() => runYes24());
    runYes24(); 
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

function runYes24() {
    chrome.storage.sync.get(['blockedPublishers'], (result) => {
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
            const container = target.closest('li') || target.closest('tr') || target.closest('.goods_grp') || target.closest('div[class*="item"]');
            if (container) {
                log(`🚫 [Yes24] 차단됨: "${matchedKeyword}"`);
                blockItem(container, matchedKeyword, SITE_CONFIG.yes24.color);
            }
        }
        target.dataset.checked = "true";
    });
}

// ========================================================
// 공통 함수
// ========================================================
function checkAndBlock(item, text, blockedList, color, siteName) {
    if (!text) return;
    const cleanText = text.replace(/\s+/g, ' ').toLowerCase();
    const matchedKeyword = blockedList.find(blocked => {
        if (!blocked) return false;
        const keyword = blocked.toLowerCase().trim();
        return keyword.length >= 1 && cleanText.includes(keyword);
    });

    if (matchedKeyword) {
        log(`🚫 [${siteName}] 차단됨: "${matchedKeyword}"`);
        blockItem(item, matchedKeyword, color);
    }
    item.dataset.filtered = "true";
}

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