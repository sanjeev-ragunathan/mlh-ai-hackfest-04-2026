import { useState, useRef, useEffect, useCallback, ChangeEvent, DragEvent, ReactNode } from "react";
import { 
  Camera, 
  Upload, 
  Trash2, 
  History, 
  ChevronRight, 
  Loader2, 
  X, 
  AlertCircle,
  Clock,
  Beef,
  Flame,
  Wheat,
  Droplets,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeFoodImage } from "./services/geminiService";
import { AnalysisResult, HistoryItem } from "./types";

const MAX_HISTORY = 10;

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("food_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = useCallback((newItem: HistoryItem) => {
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem("food_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("food_history");
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await analyzeFoodImage(selectedImage);
      setResult(analysis);
      
      if (analysis.is_food) {
        saveToHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          imageData: selectedImage,
          result: analysis
        });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadFromHistory = (item: HistoryItem) => {
    setSelectedImage(item.imageData);
    setResult(item.result);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 max-w-[1100px] mx-auto flex flex-col">
      {/* Header */}
      <header className="py-12 flex justify-between items-end">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold tracking-tight text-brand-primary"
          >
            What Am I Eating?
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-brand-secondary text-sm font-medium"
          >
            Snap your meal. Get an instant nutrition estimate.
          </motion.p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
        {/* Upload Section (Left Sidebar on Desktop) */}
        <section className="space-y-6">
          <div 
            className="bg-brand-card rounded-[18px] border border-brand-border p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 h-full flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            {!selectedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-zinc-100 rounded-[12px] p-8 flex flex-col items-center justify-center space-y-4 cursor-pointer hover:bg-zinc-50 transition-colors group bg-[#FAFAFA]"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-5 h-5 text-brand-secondary" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-brand-primary">Upload or drop meal</p>
                  <p className="text-[10px] text-brand-secondary mt-1 tracking-wide">PNG, JPG or HEIC</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-[4/3] w-full rounded-[10px] overflow-hidden bg-zinc-100">
                  <img 
                    src={selectedImage} 
                    alt="Meal preview" 
                    className="w-full h-full object-cover"
                  />
                  {!isAnalyzing && (
                    <button 
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    disabled={isAnalyzing}
                    onClick={handleAnalyze}
                    className="w-full h-11 bg-brand-primary text-white rounded-[10px] text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-zinc-800 transition-colors"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Analyze Meal
                      </>
                    )}
                  </button>
                  {!isAnalyzing && (
                    <button 
                      onClick={removeImage}
                      className="w-full h-11 bg-brand-border text-brand-primary rounded-[10px] text-sm font-bold hover:bg-zinc-200 transition-colors"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-[18px] flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Result & History Section (Main Area on Desktop) */}
        <section className="space-y-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-brand-border rounded-[18px] bg-white/50"
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                  <Flame className="w-8 h-8 text-brand-secondary opacity-20" />
                </div>
                <h3 className="text-lg font-bold text-brand-primary">Ready to analyze</h3>
                <p className="text-sm text-brand-secondary max-w-xs mt-1">Upload an image of your meal to get a detailed nutritional breakdown.</p>
              </motion.div>
            ) : result.is_food ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto"
              >
                {/* Dish Info Card */}
                <div className="md:col-span-2 bento-item flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="stat-label">Dish Name</div>
                        <h2 className="text-2xl font-bold tracking-tight text-brand-primary">{result.dish_name}</h2>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        result.healthy_or_indulgent === 'healthy' ? 'bg-green-100 text-green-700' :
                        result.healthy_or_indulgent === 'balanced' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {result.healthy_or_indulgent} choice
                      </span>
                    </div>
                    <p className="text-brand-secondary text-[14px] leading-relaxed">{result.short_description}</p>
                  </div>
                </div>

                {/* Confidence Card */}
                <div className="bento-item">
                  <div className="stat-label">Confidence Score</div>
                  <div className="stat-value">{(result.confidence_score * 100).toFixed(0)}%</div>
                  <div className="h-1 bg-zinc-100 rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence_score * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-brand-success"
                    />
                  </div>
                </div>

                {/* Ingredients Card */}
                <div className="md:row-span-2 bento-item">
                  <div className="stat-label">Visible Ingredients</div>
                  <ul className="mt-4 space-y-3">
                    {result.visible_ingredients.map((ing, i) => (
                      <li key={i} className="text-[13px] text-brand-primary flex items-start gap-2 leading-tight">
                        <span className="text-zinc-300 mt-1">•</span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 pt-6 border-t border-zinc-50">
                    <div className="stat-label">Portion Estimate</div>
                    <p className="text-[13px] font-medium text-brand-primary">{result.portion_estimate}</p>
                  </div>
                </div>

                {/* Calories Card */}
                <div className="bento-item">
                  <div className="stat-label">Estimated Calories</div>
                  <div className="stat-value flex items-baseline gap-1">
                    {result.estimated_calories}
                    <span className="text-sm font-medium text-brand-secondary">kcal</span>
                  </div>
                </div>

                {/* Macros Card */}
                <div className="bento-item">
                  <div className="stat-label">Macros (Grams)</div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-[#F9F9FB] p-2.5 rounded-[12px] text-center">
                      <div className="text-sm font-bold text-brand-primary">{result.protein_g}g</div>
                      <div className="text-[9px] font-semibold text-brand-secondary uppercase">Protein</div>
                    </div>
                    <div className="bg-[#F9F9FB] p-2.5 rounded-[12px] text-center">
                      <div className="text-sm font-bold text-brand-primary">{result.carbs_g}g</div>
                      <div className="text-[9px] font-semibold text-brand-secondary uppercase">Carbs</div>
                    </div>
                    <div className="bg-[#F9F9FB] p-2.5 rounded-[12px] text-center">
                      <div className="text-sm font-bold text-brand-primary">{result.fat_g}g</div>
                      <div className="text-[9px] font-semibold text-brand-secondary uppercase">Fat</div>
                    </div>
                  </div>
                </div>

                {/* Health Notes Card */}
                <div className="md:col-span-2 bento-item">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <div className="stat-label">Health Note</div>
                      <p className="text-[12px] leading-relaxed text-brand-primary font-medium">{result.one_short_health_note}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="stat-label">Healthier Alternative</div>
                      <p className="text-[12px] leading-relaxed text-brand-primary font-medium">{result.one_healthier_alternative}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bento-item flex flex-col items-center text-center space-y-4 py-12"
              >
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-zinc-300" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Not a Meal?</h2>
                  <p className="text-brand-secondary text-sm max-w-xs mx-auto">
                    {result.error_message || "We couldn't identify any food in this image. Please try another photo."}
                  </p>
                </div>
                <button 
                  onClick={removeImage}
                  className="text-xs font-bold text-brand-accent uppercase tracking-wider"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Section */}
          {history.length > 0 && (
            <section className="border-t border-brand-border pt-8 mt-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-secondary" />
                  <h3 className="text-[14px] font-bold text-brand-secondary uppercase tracking-tight">Recent History</h3>
                </div>
                <button 
                  onClick={clearHistory}
                  className="text-[13px] font-medium text-brand-accent hover:opacity-80 transition-opacity"
                >
                  Clear all
                </button>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="flex-shrink-0 bg-brand-card rounded-[12px] border border-brand-border p-2 pr-4 flex items-center gap-3 hover:border-zinc-300 hover:shadow-sm transition-all text-left group w-[220px]"
                  >
                    <div className="w-10 h-10 rounded-[8px] overflow-hidden flex-shrink-0 bg-zinc-100">
                      <img src={item.imageData} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate text-brand-primary">{item.result.dish_name}</p>
                      <p className="text-[11px] text-brand-secondary font-medium">
                        {item.result.estimated_calories} kcal • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 pt-8 text-center border-t border-brand-border">
        <p className="text-[11px] font-medium text-brand-secondary">
          Nutrition values are AI estimates and not medical advice. Use for informational purposes only.
        </p>
      </footer>
    </div>
  );
}


