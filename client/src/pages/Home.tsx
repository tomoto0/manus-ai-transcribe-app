import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Mic, Copy, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "processing">("idle");
  const [transcription, setTranscription] = useState("");
  const [translation, setTranslation] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ja");
  const [summaryType, setSummaryType] = useState("medium");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [autoProgress, setAutoProgress] = useState<"idle" | "transcribing" | "translating" | "summarizing">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const transcribeMutation = trpc.transcribe.audio.useMutation();
  const translateMutation = trpc.translate.text.useMutation();
  const summaryMutation = trpc.summary.generate.useMutation();
  const uploadAudioMutation = trpc.storage.uploadAudio.useMutation();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        // Automatically start transcription
        await performAutoTranscription(audioBlob);
      };

      mediaRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("マイクへのアクセスが拒否されました");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecordingState("processing");
    }
  };

  const performAutoTranscription = async (blob: Blob) => {
    try {
      setAutoProgress("transcribing");
      
      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
      
      // Upload audio to storage
      const uploadResult = await uploadAudioMutation.mutateAsync({
        audioData: base64Audio,
        mimeType: blob.type || "audio/webm",
      });
      
      // Transcribe using the uploaded URL
      const result = await transcribeMutation.mutateAsync({
        audioUrl: uploadResult.url,
        language: "en",
      });
      
      const transcribedText = typeof result === 'object' && 'text' in result ? (result.text as string) : String(result);
      setTranscription(transcribedText);
      
      // Auto-translate
      setAutoProgress("translating");
      const translateResult = await translateMutation.mutateAsync({
        text: transcribedText,
        targetLanguage: selectedLanguage,
      });
      const translatedText = typeof translateResult.translation === 'string' ? translateResult.translation : '';
      setTranslation(translatedText);
      
      // Auto-summarize
      setAutoProgress("summarizing");
      const summaryResult = await summaryMutation.mutateAsync({
        text: transcribedText,
        type: summaryType as "short" | "medium" | "detailed",
        language: selectedLanguage,
      });
      const summaryText = typeof summaryResult.summary === 'string' ? summaryResult.summary : '';
      setSummary(summaryText);
      
      setAutoProgress("idle");
      setRecordingState("idle");
    } catch (error) {
      console.error("Auto processing failed:", error);
      setAutoProgress("idle");
      setRecordingState("idle");
      alert("処理に失敗しました。もう一度お試しください。");
    }
  };

  const handleTranslate = async () => {
    if (!transcription) {
      alert("先に音声を転写してください");
      return;
    }

    try {
      const result = await translateMutation.mutateAsync({
        text: transcription,
        targetLanguage: selectedLanguage,
      });
      setTranslation(typeof result.translation === 'string' ? result.translation : '');
    } catch (error) {
      console.error("Translation failed:", error);
      alert("翻訳に失敗しました");
    }
  };

  const handleSummarize = async () => {
    if (!transcription) {
      alert("先に音声を転写してください");
      return;
    }

    try {
      const result = await summaryMutation.mutateAsync({
        text: transcription,
        type: summaryType as "short" | "medium" | "detailed",
        language: selectedLanguage,
      });
      setSummary(typeof result.summary === 'string' ? result.summary : '');
    } catch (error) {
      console.error("Summary generation failed:", error);
      alert("サマリー生成に失敗しました");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getProgressMessage = () => {
    switch (autoProgress) {
      case "transcribing":
        return "音声を転写中...";
      case "translating":
        return "翻訳中...";
      case "summarizing":
        return "議事録を生成中...";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{APP_TITLE}</h1>
          <p className="text-gray-600">リアルタイム音声転写、翻訳、議事録作成</p>
  
        </div>

        {/* Progress Indicator */}
        {autoProgress !== "idle" && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-blue-900 font-medium">{getProgressMessage()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recording Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                音声録音
              </CardTitle>
              <CardDescription>マイクで音声を録音して自動処理します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {recordingState === "idle" && autoProgress === "idle" && (
                  <Button onClick={startRecording} className="flex-1 bg-red-600 hover:bg-red-700">
                    <Mic className="w-4 h-4 mr-2" />
                    録音開始
                  </Button>
                )}
                {recordingState === "recording" && (
                  <Button onClick={stopRecording} className="flex-1 bg-orange-600 hover:bg-orange-700">
                    停止
                  </Button>
                )}
                {(recordingState === "processing" || autoProgress !== "idle") && (
                  <Button disabled className="flex-1">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    処理中...
                  </Button>
                )}
              </div>

              {/* Process Status */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {transcription ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={transcription ? "text-green-600 font-medium" : "text-gray-500"}>
                    転写完了
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {translation ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={translation ? "text-green-600 font-medium" : "text-gray-500"}>
                    翻訳完了
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {summary ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={summary ? "text-green-600 font-medium" : "text-gray-500"}>
                    議事録生成完了
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcription Section */}
          <Card>
            <CardHeader>
              <CardTitle>転写結果</CardTitle>
              <CardDescription>転写されたテキスト</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder="転写結果がここに表示されます..."
                className="min-h-[200px]"
              />
              {transcription && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => copyToClipboard(transcription)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  コピー
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Translation Section */}
          <Card>
            <CardHeader>
              <CardTitle>翻訳</CardTitle>
              <CardDescription>転写テキストを翻訳します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="言語を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="en">英語</SelectItem>
                  <SelectItem value="es">スペイン語</SelectItem>
                  <SelectItem value="fr">フランス語</SelectItem>
                  <SelectItem value="zh">中国語</SelectItem>
                  <SelectItem value="ko">韓国語</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleTranslate}
                className="w-full"
                disabled={!transcription || translateMutation.isPending}
              >
                {translateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    翻訳中...
                  </>
                ) : (
                  "翻訳"
                )}
              </Button>

              <Textarea
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="翻訳結果がここに表示されます..."
                className="min-h-[200px]"
              />
              {translation && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => copyToClipboard(translation)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  コピー
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle>議事録</CardTitle>
              <CardDescription>自動生成された議事録</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={summaryType} onValueChange={setSummaryType}>
                <SelectTrigger>
                  <SelectValue placeholder="要約形式を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">短い要約（1-2段落）</SelectItem>
                  <SelectItem value="medium">中程度の要約（3-4段落）</SelectItem>
                  <SelectItem value="detailed">詳細な要約（5段落以上）</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleSummarize}
                className="w-full"
                disabled={!transcription || summaryMutation.isPending}
              >
                {summaryMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    議事録を生成中...
                  </>
                ) : (
                  "議事録を生成"
                )}
              </Button>

              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="議事録がここに表示されます..."
                className="min-h-[200px]"
              />
              {summary && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => copyToClipboard(summary)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  コピー
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

