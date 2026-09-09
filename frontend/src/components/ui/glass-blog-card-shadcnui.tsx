import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, Clock, Mic } from "lucide-react";

interface GlassBlogCardProps {
  title?: string;
  excerpt?: string;
  image?: string;
  author?: {
    name: string;
    avatar: string;
  };
  date?: string;
  readTime?: string;
  tags?: string[];
  className?: string;
  onClick?: () => void;
  isGrid?: boolean;
}

const defaultBeachImage = "/beach-sunset.jpg";

export function GlassBlogCard({
  title = "Untitled Entry",
  excerpt = "",
  image = defaultBeachImage,
  author = { name: "User", avatar: "" },
  date = "Today",
  readTime = "Text Entry",
  tags = [],
  className,
  onClick,
  isGrid = true,
}: GlassBlogCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full cursor-pointer", className)}
      onClick={onClick}
    >
      <Card className="group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
        {/* Beach Photo Background Overlay - Only in Grid Mode */}
        {isGrid && (
          <div className="relative h-32 w-full overflow-hidden bg-slate-900">
            <img
              src={image || defaultBeachImage}
              alt="Beach sunset background"
              className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              {tags?.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-background/85 backdrop-blur-md text-[10px] px-2 py-0.5 font-semibold text-foreground border border-white/20 shadow-sm"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Centered High-Contrast Content Section */}
        <div className={`flex flex-col gap-3 p-4 ${isGrid ? 'pt-1' : ''}`}>
          {!isGrid && tags && tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-1">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-secondary/50 text-[10px] px-2 py-0.5 font-semibold text-foreground border border-border shadow-sm"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-1">
              {title}
            </h3>
            <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {excerpt || "No text body."}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={author?.avatar} alt={author?.name} />
                <AvatarFallback className="text-[9px] font-bold">{author?.name ? author.name[0] : "D"}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground/90">{date}</span>
            </div>

            <div className="flex items-center gap-1 font-medium">
              {readTime.includes("Voice") ? <Mic className="h-3 w-3 text-primary" /> : <Clock className="h-3 w-3" />}
              <span>{readTime}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
