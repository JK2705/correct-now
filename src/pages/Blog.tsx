import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { X } from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  contentHtml: string;
  contentText?: string;
  imageUrls?: string[];
  coverImageUrl?: string;
  publishedAt?: string;
  createdAt?: string;
};

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const normalizeBlogHtml = (html: string) =>
    html.replace(
      /href="(?!https?:|mailto:|tel:|#|\/)([^"]+)"/gi,
      'href="https://$1"'
    );

  useEffect(() => {
    const loadPosts = async () => {
      const db = getFirebaseDb();
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const blogQuery = query(
          collection(db, "blogs"),
          orderBy("publishedAt", "desc")
        );
        const snap = await getDocs(blogQuery);
        const list: BlogPost[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          const contentHtml = String(data?.contentHtml || data?.content || "");
          const contentText = String(data?.contentText || "").trim();
          const imageUrls: string[] = Array.isArray(data?.imageUrls)
            ? data.imageUrls
            : data?.imageUrl
            ? [String(data.imageUrl)]
            : [];
          return {
            id: docSnap.id,
            title: data?.title || "",
            contentHtml,
            contentText,
            imageUrls,
            coverImageUrl: String(data?.coverImageUrl || imageUrls[0] || ""),
            publishedAt: data?.publishedAt,
            createdAt: data?.createdAt,
          };
        });
        setPosts(list);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {!expandedId && (
          <section className="border-b border-border bg-gradient-to-b from-background to-accent/5 py-16 md:py-24">
            <div className="container max-w-4xl">
              <div className="flex flex-col items-center text-center gap-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                  Blog
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                  Updates, writing tips, and product news from CorrectNow
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="py-16 md:py-20">
          <div className="container max-w-6xl">
            {expandedId && (
              <div className="mb-6">
                <Button variant="outline" onClick={() => setExpandedId(null)}>
                  ← Go Back
                </Button>
              </div>
            )}
            {loading ? (
              <p className="text-center text-muted-foreground">Loading posts...</p>
            ) : posts.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => {
                  const isExpanded = expandedId === post.id;
                  const coverImage = post.coverImageUrl || post.imageUrls?.[0] || "";
                  const excerpt = post.contentText
                    ? post.contentText
                    : post.contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                  return (
                    <Card
                      key={post.id}
                      className={`group overflow-hidden border-border transition-all ${
                        isExpanded ? "lg:col-span-3" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : post.id)
                        }
                        className="w-full text-left"
                      >
                        {coverImage && (
                          <div
                            className={`w-full bg-muted flex items-center justify-center ${
                              isExpanded ? "h-72 md:h-96" : "h-56"
                            }`}
                            onClick={(e) => {
                              if (isExpanded) {
                                e.stopPropagation();
                                setLightboxImage(coverImage);
                              }
                            }}
                          >
                            <img
                              src={coverImage}
                              alt={post.title}
                              className={`max-w-full max-h-full object-contain transition-all duration-300 ${
                                isExpanded ? "cursor-pointer hover:opacity-90" : "cursor-pointer hover:opacity-90"
                              }`}
                              loading="lazy"
                            />
                          </div>
                        )}
                        <CardContent className="p-6 space-y-3">
                          <div className="flex flex-col gap-2">
                            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                              {post.title}
                            </h2>
                            <span className="text-sm text-muted-foreground">
                              {post.publishedAt
                                ? new Date(post.publishedAt).toLocaleString()
                                : post.createdAt
                                ? new Date(post.createdAt).toLocaleString()
                                : ""}
                            </span>
                          </div>
                          {isExpanded ? (
                            <div className="space-y-6">
                              {post.imageUrls && post.imageUrls.length > 1 && (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  {post.imageUrls.map((url, idx) => (
                                    <div 
                                      key={idx} 
                                      className="w-full h-48 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxImage(url);
                                      }}
                                    >
                                      <img
                                        src={url}
                                        alt={`${post.title} image ${idx + 1}`}
                                        className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        loading="lazy"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="blog-content prose max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: normalizeBlogHtml(post.contentHtml) }} />
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground leading-relaxed line-clamp-3">
                              {excerpt}
                            </p>
                          )}
                        </CardContent>
                      </button>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No blog posts yet.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Blog;
