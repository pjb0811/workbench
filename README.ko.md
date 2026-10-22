# workbench

[![npm](https://img.shields.io/npm/v/@jbpark/workbench.svg?style=flat-square&color=black&labelColor=eeeeee)](https://www.npmjs.com/package/@jbpark/workbench)

[English](README.md) | [한국어](README.ko.md)

헤드리스 React 파일 트리·에디터입니다. `Workbench`는 지연 로딩되는 가상화 파일 트리와 탭 에디터를 나란히 보여 주고, 파일은 교체 가능한 `WorkbenchAdapter`에서 가져옵니다. 그래서 같은 위젯을 로컬 폴더, REST API, 그 밖의 어떤 소스에도 연결할 수 있습니다.

**문서와 라이브 데모: https://workbench-guide.vercel.app** (영문)

## 특징

- **어떤 데이터 소스든.** 어댑터 메서드 네 개(`getTree`, `loadChildren`, `readFile`, `writeFile`)로 로컬 폴더(`createFsAdapter`), REST API(`createHttpAdapter`), 직접 만든 저장소를 연결합니다. 디렉터리는 한 단계씩 불러옵니다.
- **어떤 에디터든.** 파일 탭, 저장 안 한 상태, 저장은 엔진에 묶이지 않은 렌더러 계약으로 동작합니다. `@jbpark/workbench/code-editor`의 CodeMirror 에디터를 쓰거나 직접 만든 에디터를 넣을 수 있습니다.
- **헤드리스.** CSS도 클래스 이름도 없습니다. 모든 영역과 상태를 `data-*` 속성으로 노출합니다.
- **완성된 위젯.** 드래그로 순서를 바꾸는 탭, 크기를 조절하는 사이드바, 읽기 전용 모드, 다크·라이트 테마를 제공합니다.

## 설치

```bash
pnpm add @jbpark/workbench
```

React 19.1.1 이상이 peer dependency입니다. 기본 에디터는 별도 진입점이고 optional peer가 따로 있습니다.

```bash
pnpm add @jbpark/ui-kit @uiw/react-codemirror @uiw/codemirror-theme-vscode \
  @codemirror/lang-javascript @codemirror/merge codemirror
```

## 사용법

```tsx
import { useState } from 'react';

import {
  Workbench,
  type WorkbenchAdapter,
  createFsAdapter,
} from '@jbpark/workbench';
import { codeEditorRenderer } from '@jbpark/workbench/code-editor';

export function App() {
  const [adapter, setAdapter] = useState<WorkbenchAdapter>();

  const openFolder = async () => {
    // File System Access API: Chromium 계열 브라우저, HTTPS 또는 localhost에서만 동작합니다.
    const directory = await window.showDirectoryPicker({ mode: 'readwrite' });

    setAdapter(createFsAdapter(directory));
  };

  if (!adapter) {
    return <button onClick={openFolder}>Open folder</button>;
  }

  // 위젯은 부모를 채우므로 부모에 높이가 있어야 합니다.
  return (
    <div style={{ height: '100vh' }}>
      <Workbench adapter={adapter} renderEditor={codeEditorRenderer} />
    </div>
  );
}
```

스타일을 넣기 전까지 Workbench는 스타일 없는 마크업만 그립니다. [Styling](https://workbench-guide.vercel.app/docs/styling) 문서에 모든 속성 목록과 바로 쓸 수 있는 Tailwind CSS v4 스타일시트가 있습니다.

| 문서                                                               | 내용                                                           |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| [Workbench](https://workbench-guide.vercel.app/docs/workbench)     | props, 저장, 탭, 읽기 전용, 테마, 크기 조절                    |
| [File tree](https://workbench-guide.vercel.app/docs/file-tree)     | `FileTree` 단독 사용, 지연 로딩, 아이콘                        |
| [File editor](https://workbench-guide.vercel.app/docs/file-editor) | `FileEditor`, 렌더러 계약, CodeMirror 진입점, 직접 만든 에디터 |
| [Adapters](https://workbench-guide.vercel.app/docs/adapters)       | `createFsAdapter`, `createHttpAdapter`, 어댑터 직접 만들기     |
| [Styling](https://workbench-guide.vercel.app/docs/styling)         | 모든 `data-*` 속성, inline 스타일, Tailwind CSS v4 스타일시트  |

## 패키지 진입점

| 진입점                          | 내용                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `@jbpark/workbench`             | `Workbench`, `FileTree`, `FileEditor`, `createFsAdapter`, `createHttpAdapter`, `detectLanguage`와 그 타입 |
| `@jbpark/workbench/code-editor` | `@jbpark/ui-kit`의 CodeMirror 에디터를 쓰는 `codeEditorRenderer`, `createCodeEditorRenderer`              |

## 개발

`.nvmrc`의 Node 버전과 pnpm을 사용합니다.

```bash
pnpm install
pnpm dev                    # demo/의 데모 앱 (로컬 폴더 또는 HTTP 목 소스)
pnpm build                  # dist/에 라이브러리 번들과 타입 생성
pnpm lint
pnpm check-types
pnpm test
pnpm check-declarations     # 데모 전역 타입 없이 빌드된 선언 검사

pnpm --dir website install  # 문서 사이트는 별도 pnpm 프로젝트입니다
pnpm --dir website start    # 라이브러리를 빌드한 뒤 사이트를 띄웁니다
```

런타임 의존성을 `peerDependencies`, `dependencies`, 소비자 중 어디에 둘지는 [docs/dependency-policy.md](docs/dependency-policy.md)에 정해 두었습니다.

릴리스는 [changesets](https://github.com/changesets/changesets)를 씁니다. 배포되는 패키지를 바꾸는 PR에는 `pnpm changeset`으로 changeset을 추가합니다.

## 라이선스

[MIT](LICENSE)
