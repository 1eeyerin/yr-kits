# StrictPropsWithChildren

`StrictPropsWithChildren<P>`는 **children을 반드시 포함**하도록 강제하는 **타입**입니다.<br/>
자식 노드를 필수로 받는 컴포넌트(레이아웃, 래퍼 등)의 props 타입에 적합합니다.

## Install

```bash
npx yr-kits add strict-props-with-children
```

## Example

```tsx
import type { StrictPropsWithChildren } from "./types/strict-props-with-children";

type CardProps = StrictPropsWithChildren<{ title: string }>;

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

<Card title="제목">내용</Card>; // ✅
<Card title="제목" />; // ❌ 타입 에러: children 필요
```

추가 props는 제네릭 `P`에 넣으면 되고, props 없이 쓰려면 `StrictPropsWithChildren`만 씁니다.
