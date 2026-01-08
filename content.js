// content.js - [Final] 알라딘 정밀 타격(PublisherSearch) 적용 버전

console.log("[CleanBook] 확장 프로그램 로드됨");

// =========================================
// [1. 설정] 사이트별 선택자 관리
// =========================================
const SITE_CONFIG = {
  kyobo: {
    pubSelector: '.prod_item, .prod_row, .list_item, .auto_slide_item, .curr_slide_item, ul.prod_list > li',
    bestSelector: 'ol > li, ul.list_type01 > li, .view_type_list > li',
    targetClasses: '.prod_publish, .prod_author, .publish, .author, .prod_info',
    color: '#474c98'
  },
  aladin: {
    // 알라딘의 책 박스들
    itemSelector: '.ss_book_box, .v2_box_list, .ss_book_list > li',
    
    // [핵심 변경] 사용자가 제보한 'PublisherSearch'가 포함된 링크만 정확히 타겟팅
    // 이 선택자는 출판사 이름이 적힌 a태그만 콕 집어냅니다.
    publisherLinkSelector: 'a[href*="PublisherSearch"]',
    
    color: '#eb3b94'
  }
};

// =========================================
// [2. 진입점]
// =========================================
const hostname = window.location.hostname;

if (hostname.includes('kyobobook.co.kr')) {
    kyoboInit();
} else if (hostname.includes('aladin.co.kr')) {
    aladinInit();
}

// =========================================
// [3. 교보문고 모듈] (기존 유지)
// =========================================

function kyoboInit() {
    console.log("%c[CleanBook] 교보문고 모듈 시작", "color: #fff; background: #474c98; padding: 4px; border-radius: 4px;");

    const observer = new MutationObserver(() => {
        chrome.storage.sync.get(['blockedPublishers'], (result) => {
            const blockedList = result.blockedPublishers || [];
            if(blockedList.length > 0) {
                if (window.location.href.includes('bestseller')) {
                    kyoboBestsellerBlock(blockedList);
                } else {
                    kyoboPubBlock(blockedList);
                }
            }
        });
    });

    chrome.storage.sync.get(['blockedPublishers'], (result) => {
        const blockedList = result.blockedPublishers || [];
        if (blockedList.length > 0) {
            const run = () => {
                if (window.location.href.includes('bestseller')) {
                    kyoboBestsellerBlock(blockedList);
                } else {
                    kyoboPubBlock(blockedList);
                }
            };
            run();
            setTimeout(run, 500);
            setTimeout(run, 1000);
            setTimeout(run, 2000);
        }
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
}

function kyoboPubBlock(blockedList) {
    const items = document.querySelectorAll(SITE_CONFIG.kyobo.pubSelector);
    const targetSelector = SITE_CONFIG.kyobo.targetClasses;

    items.forEach(item => {
        if (item.dataset.filtered) return;

        const targetEls = item.querySelectorAll(targetSelector);
        let targetText = "";
        
        if (targetEls.length > 0) {
            targetEls.forEach(el => { targetText += el.innerText + " "; });
        } else {
            targetText = item.innerText;
        }

        if (!targetText || targetText.length < 2) return;
        const cleanText = targetText.replace(/\s+/g, ' ').toLowerCase();

        const matchedKeyword = blockedList.find(blocked => {
            if (!blocked) return false;
            const keyword = blocked.toLowerCase().trim();
            return keyword.length >= 2 && cleanText.includes(keyword);
        });

        if (matchedKeyword) {
            console.log(`🚫 [Kyobo/일반] 차단됨: "${matchedKeyword}"`);
            blockItem(item, matchedKeyword, SITE_CONFIG.kyobo.color);
        }
        item.dataset.filtered = "true";
    });
}

function kyoboBestsellerBlock(blockedList) {
    const items = document.querySelectorAll(SITE_CONFIG.kyobo.bestSelector);

    items.forEach(item => {
        if (item.dataset.filtered) return;

        let targetText = "";
        const allElements = item.querySelectorAll("*");
        
        for (let el of allElements) {
            if (el.innerText && el.innerText.length > 0) {
                if (el.innerText.includes('·')) {
                    targetText = el.innerText;
                    break; 
                }
            }
        }
        if (!targetText) targetText = item.innerText;

        const cleanText = targetText.replace(/\s+/g, ' ').toLowerCase();
        const matchedKeyword = blockedList.find(blocked => {
            if (!blocked) return false;
            const keyword = blocked.toLowerCase().trim();
            return keyword.length >= 2 && cleanText.includes(keyword);
        });

        if (matchedKeyword) {
            console.log(`🚫 [Kyobo/베스트] 차단됨: "${matchedKeyword}"`);
            blockItem(item, matchedKeyword, SITE_CONFIG.kyobo.color);
        }
        item.dataset.filtered = "true";
    });
}

// =========================================
// [4. 알라딘 모듈] (정밀 타격 적용)
// =========================================

function aladinInit() {
    console.log("%c[CleanBook] 알라딘 모듈 시작", "color: #fff; background: #eb3b94; padding: 4px; border-radius: 4px;");

    const observer = new MutationObserver(() => {
        chrome.storage.sync.get(['blockedPublishers'], (result) => {
            const blockedList = result.blockedPublishers || [];
            if(blockedList.length > 0) {
                // 알라딘은 페이지 구분 없이 'PublisherSearch' 링크만 있으면 만사형통
                aladinUniversalBlock(blockedList);
            }
        });
    });

    chrome.storage.sync.get(['blockedPublishers'], (result) => {
        const blockedList = result.blockedPublishers || [];
        if (blockedList.length > 0) {
            const run = () => aladinUniversalBlock(blockedList);
            run();
            setTimeout(run, 500);
            setTimeout(run, 1000);
            setTimeout(run, 2000);
        }
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
}

// [알라딘 통합 함수] 일반/베스트셀러 구분 필요 없음 (링크 기반이라 강력함)
function aladinUniversalBlock(blockedList) {
    const config = SITE_CONFIG.aladin;
    const items = document.querySelectorAll(config.itemSelector);

    items.forEach(item => {
        if (item.dataset.filtered) return;

        // [핵심 로직] PublisherSearch가 들어간 a태그만 찾는다.
        const publisherLink = item.querySelector(config.publisherLinkSelector);

        if (publisherLink) {
            // 링크가 발견되면, 그 안의 텍스트(출판사 이름)만 검사한다.
            // 제목이나 다른 정보는 아예 보지 않음 -> 오차단 0%
            const publisherName = publisherLink.innerText.trim();
            const cleanName = publisherName.replace(/\s+/g, ' ').toLowerCase();

            const matchedKeyword = blockedList.find(blocked => {
                if (!blocked) return false;
                const keyword = blocked.toLowerCase().trim();
                // 출판사 이름 안에 차단 키워드가 포함되어 있는지 확인
                return keyword.length >= 1 && cleanName.includes(keyword);
            });

            if (matchedKeyword) {
                console.log(`🚫 [Aladin] 정밀 차단됨: "${matchedKeyword}" (출판사: ${publisherName})`);
                blockItem(item, matchedKeyword, config.color);
            }
        } 
        
        // 링크가 없으면? 
        // 굳이 위험하게 전체 텍스트 스캔하지 않고 그냥 넘어감 (사용자 요청: 오차단 방지 우선)
        // 알라딘은 대부분 링크가 있으므로 안전함.
        
        item.dataset.filtered = "true";
    });
}

// =========================================
// [5. 공통 유틸]
// =========================================
function blockItem(element, name, color) {
    if (element.querySelector('.cleanbook-overlay')) return;
    
    element.style.position = 'relative';
    const overlay = document.createElement('div');
    overlay.className = 'cleanbook-overlay';
    const finalColor = color || 'red';

    overlay.innerHTML = `
      <div style="background:white; border:2px solid ${finalColor}; padding:6px; border-radius:6px; text-align:center; font-weight:bold; color:#333; font-size: 13px; width:90%; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
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
    });

    element.appendChild(overlay);
}