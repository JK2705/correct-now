import { useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProofreadingEditor from "@/components/ProofreadingEditor";
import { getDocById } from "@/lib/docs";

const Editor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const state = (location.state as { text?: string; id?: string } | undefined) ?? {};
  const initialDocId = state.id;
  const initialText = useMemo(() => {
    if (initialDocId) {
      const doc = getDocById(initialDocId);
      if (doc?.text) return doc.text;
    }
    return state.text ?? "";
  }, [initialDocId, state.text]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ProofreadingEditor
          editorRef={editorRef}
          initialText={initialText}
          initialDocId={initialDocId}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Editor;
