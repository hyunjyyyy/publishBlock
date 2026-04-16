### CleanBook 빌드 및 패키징 방법

CleanBook은 Manifest V3를 사용하는 크로스 브라우저 확장 프로그램이므로, Chrome과 Firefox 모두를 위해 패키징할 수 있습니다.

#### 1. 자동 빌드 (권장)

제공된 `build.sh` 스크립트를 사용하여 두 브라우저용 ZIP 파일을 생성할 수 있습니다.

1.  터미널을 엽니다.
2.  프로젝트 루트 디렉토리로 이동합니다.
3.  스크립트에 실행 권한을 부여합니다:
    ```bash
    chmod +x build.sh
    ```
4.  스크립트를 실행합니다:
    ```bash
    ./build.sh
    ```
5.  패키징된 확장 프로그램은 `dist/` 디렉토리에서 확인할 수 있습니다.

---

#### 2. 수동 패키징

**Google Chrome:**

1.  `chrome://extensions/` 페이지로 이동합니다.
2.  오른쪽 상단의 **개발자 모드**를 활성화합니다.
3.  **확장 프로그램 압축**을 클릭합니다.
4.  프로젝트 루트 폴더를 선택합니다.
5.  Chrome이 `.crx` 파일과 `.pem` 개인 키를 생성합니다.
    - _또는_, 단순히 모든 파일(`manifest.json` 포함)을 ZIP으로 압축하여 Chrome 웹 스토어에 업로드할 수도 있습니다.

**Mozilla Firefox:**

1.  Mozilla에서 권장하는 `web-ext` 도구를 사용할 수 있습니다:
    ```bash
    npx web-ext build
    ```
2.  _또는_, 수동으로 모든 파일을 ZIP으로 압축할 수 있습니다(`manifest.json`이 ZIP의 최상위에 있는지 확인하세요).
3.  ZIP 파일을 [AMO (Add-ons for Firefox)](https://addons.mozilla.org/developers/)에 제출합니다.

---

#### 3. 로컬 개발 및 테스트

**Chrome / Edge / Brave:**

1.  `chrome://extensions/` 페이지로 이동합니다.
2.  **개발자 모드**를 켭니다.
3.  **압축해제된 확장 프로그램을 로드합니다**를 클릭하고 프로젝트 루트 폴더를 선택합니다.

**Firefox:**

1.  `about:debugging#/runtime/this-firefox` 페이지로 이동합니다.
2.  **임시 부가 기능 로드...**를 클릭합니다.
3.  프로젝트 루트에 있는 `manifest.json` 파일을 선택합니다.
