// content.js - [Final] Yes24 UI 깨짐 수정 버전

// [배포 설정] true: 로그 보임 (개발용) / false: 로그 숨김 (배포용)
const IS_DEBUG = false;

// 스마트 로그 함수
const log = (...args) => {
    if (IS_DEBUG) console.log(...args);
};

log("[CleanBook] 확장 프로그램 로드됨");

const SITE_CONFIG = {
  kyobo: {
    pubSelector: '.prod_item, .prod_row, .list_item, .auto_slide_item, .curr_slide_item, ul.prod_list > li',
    bestSelector: 'ol > li, ul.list_type01 > li, .view_type_list > li',
    targetClasses: '.prod_publish, .prod_author, .publish, .author, .prod_info',
    color: '#474c98'
  },
  aladin: {
    itemSelector: '.ss_book_box, .v2_box_list, .ss_book_list > li',
    publisherLinkSelector: 'a[href*="PublisherSearch"]',
    color: '#eb3b94'
  },
  yes24: {
    // 상품 목록 단위 (리스트, 테이블, 타일 형태 모두 커버)
    itemSelector: '.goods_list > li, .goodsList > li, .sGoodsList > li, #category_layout tr, .sect_goods, .cCont_goodsSet .item',
    // 저자/출판사 정보가 있는 클래스들
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
// 1. 교보문고 (Kyobo)
// ========================================================
function kyoboInit() {
    log("[CleanBook] 교보문고 모듈 시작");
    const observer = new MutationObserver(() => runKyobo());
    runKyobo();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

function runKyobo() {
    chrome.storage.sync.get(['blockedPublishers'], (result) => {
        const blockedList = result.blockedPublishers || [];
        if (blockedList.length > 0) {
            if (window.location.href.includes('bestseller')) {
                kyoboBestsellerBlock(blockedList);
            } else {
                kyoboPubBlock(blockedList);
            }
        }
    });
}

function kyoboPubBlock(blockedList) {
    const items = document.querySelectorAll(SITE_CONFIG.kyobo.pubSelector);
    items.forEach(item => {
        if (item.dataset.filtered) return;
        const targetEls = item.querySelectorAll(SITE_CONFIG.kyobo.targetClasses);
        let targetText = "";
        targetEls.forEach(el => { targetText += el.innerText + " "; });
        if (!targetText) targetText = item.innerText; 
        checkAndBlock(item, targetText, blockedList, SITE_CONFIG.kyobo.color, "Kyobo");
    });
}

function kyoboBestsellerBlock(blockedList) {
    const items = document.querySelectorAll(SITE_CONFIG.kyobo.bestSelector);
    items.forEach(item => {
        if (item.dataset.filtered) return;
        checkAndBlock(item, item.innerText, blockedList, SITE_CONFIG.kyobo.color, "KyoboBest");
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
// 3. 예스24 (Yes24) - Bottom-Up 방식
// ========================================================
function yes24Init() {
    log("[CleanBook] Yes24 모듈 시작 (Bottom-Up)");
    const observer = new MutationObserver(() => runYes24());
    runYes24(); // 초기 실행
    setTimeout(runYes24, 1000); // 1초 뒤 재확인
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

function runYes24() {
    chrome.storage.sync.get(['blockedPublishers'], (result) => {
        const blockedList = result.blockedPublishers || [];
        if (blockedList.length > 0) yes24Block(blockedList);
    });
}

function yes24Block(blockedList) {
    // 1. 범인(저자/출판사 텍스트) 먼저 찾기
    const targets = document.querySelectorAll(SITE_CONFIG.yes24.targetSelector);
    
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
            // 3. 범인을 포함하는 '책 덩어리' 찾기
            const container = target.closest('li') || target.closest('tr') || target.closest('.goods_grp') || target.closest('div[class*="item"]');

            if (container) {
                log(`🚫 [Yes24] 차단됨: "${matchedKeyword}"`);
                blockItem(container, matchedKeyword, SITE_CONFIG.yes24.color);
            } else {
                // 컨테이너 못 찾으면 텍스트 자체라도 가림
                blockItem(target, matchedKeyword, SITE_CONFIG.yes24.color);
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
    
    // [FIX 1] Yes24 테이블(tr) UI 깨짐 해결
    // Chrome에서 tr에 transform을 주면 좌표 기준점(Containing Block)이 되어 absolute가 정상 작동함
    if (element.tagName.toLowerCase() === 'tr') {
        element.style.transform = 'scale(1)'; 
    } else {
        // tr이 아닐 때는 기존 방식대로 relative
        const style = window.getComputedStyle(element);
        if (style.position === 'static') {
            element.style.position = 'relative';
        }
    }

    const overlay = document.createElement('div');
    overlay.className = 'cleanbook-overlay';
    const finalColor = color || 'red';

    // [FIX 2] 텍스트 스타일 초기화 (white-space, line-height 등)
    // Yes24의 "white-space: nowrap" 같은 속성을 무시하고 줄바꿈이 되도록 강제 설정
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
        letter-spacing: normal !important;
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