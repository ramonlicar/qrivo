
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChatIA } from './ChatIA';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { Modal } from './Modal';
import { Badge } from './Badge';
import ReactMarkdown from 'react-markdown';

type SupportTab = 'chat' | 'docs' | 'videos';

interface DocArticle {
  id: string;
  category_id: string;
  title: string;
  content: string;
  votes_useful: number;
  votes_not_useful: number;
  category_name?: string;
}

interface DocCategory {
  id: string;
  name: string;
  display_order: number;
  doc_articles?: DocArticle[];
}

interface VideoTutorial {
  id: string;
  category_id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  duration: string;
  views_count: number;
  created_at: string;
  category_name?: string;
  description?: string;
}

interface TutorialCategory {
  id: string;
  name: string;
  display_order: number;
  tutorial_videos?: VideoTutorial[];
}

// Hardcoded database removed in favor of Supabase sync

// O banco de dados de vídeos agora é carregado via Supabase

export const SupportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SupportTab>('chat');
  const [docSearch, setDocSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocArticle | null>(null);
  const [categories, setCategories] = useState<TutorialCategory[]>([]);
  const [docCategories, setDocCategories] = useState<DocCategory[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userVoted, setUserVoted] = useState<string | null>(null);

  const menuItems = [
    { id: 'chat' as SupportTab, label: 'Assistente IA', icon: 'ph-sparkle' },
    { id: 'docs' as SupportTab, label: 'Documentação', icon: 'ph-file-text' },
    { id: 'videos' as SupportTab, label: 'Vídeos Tutoriais', icon: 'ph-video-camera' },
  ];

  const filteredDocs = useMemo(() => {
    const search = docSearch.toLowerCase();

    return docCategories.map(cat => ({
      ...cat,
      doc_articles: (cat.doc_articles || []).filter(doc =>
        doc.title.toLowerCase().includes(search) ||
        cat.name.toLowerCase().includes(search)
      )
    })).filter(cat => cat.doc_articles.length > 0);
  }, [docSearch, docCategories]);

  useEffect(() => {
    const fetchTutorials = async () => {
      setIsLoadingVideos(true);
      try {
        const { data, error } = await supabase
          .from('tutorial_categories')
          .select(`
            id,
            name,
            display_order,
            tutorial_videos (*)
          `)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching tutorials:', err);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    const fetchDocs = async () => {
      setIsLoadingDocs(true);
      try {
        const { data, error } = await supabase
          .from('doc_categories')
          .select(`
            id,
            name,
            display_order,
            doc_articles (*)
          `)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setDocCategories(data || []);
      } catch (err) {
        console.error('Error fetching docs:', err);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchTutorials();
    fetchDocs();
  }, []);

  const handleDocVote = async (articleId: string, type: 'useful' | 'not_useful') => {
    if (userVoted === articleId) return;

    try {
      const column = type === 'useful' ? 'votes_useful' : 'votes_not_useful';

      // Fetch current votes first to increment
      const { data: current, error: fetchError } = await supabase
        .from('doc_articles')
        .select(column)
        .eq('id', articleId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('doc_articles')
        .update({ [column]: (current[column] || 0) + 1 })
        .eq('id', articleId);

      if (error) throw error;
      setUserVoted(articleId);
    } catch (err) {
      console.error('Error updating vote:', err);
    }
  };

  const renderMarkdown = (content: string) => {
    return (
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-h4 font-bold text-neutral-black mt-6 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-h5 font-bold text-neutral-black mt-5 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-body1 font-bold text-neutral-black mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 list-disc pl-5">{children}</ul>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-neutral-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-secondary-600 font-mono text-[0.9em]">{children}</code>
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  const formatViews = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return `Há ${diffDays} dias`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
    return `Há ${Math.floor(diffDays / 30)} meses`;
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';

    // YouTube
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^& \n?#]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;

    // Vimeo
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;

    return url;
  };

  const renderContent = () => {
    if (activeTab === 'chat') return <ChatIA />;

    if (activeTab === 'docs') {
      if (selectedDoc) {
        return (
          <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden">
            {/* Header de Leitura do Documento */}
            <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] border-b border-neutral-200 bg-white gap-4 min-h-[64px] lg:min-h-[72px] flex-none">
              <button
                onClick={() => setSelectedDoc(null)}
                className="flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 transition-all shadow-small active:scale-95 flex-none"
              >
                <i className="ph ph-bold ph-arrow-left text-neutral-800 text-lg lg:text-xl"></i>
              </button>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-tag font-bold text-primary-500 tracking-widest">{selectedDoc.category_name}</span>
                </div>
                <h5 className="text-h5 font-bold text-neutral-black tracking-tight m-0 truncate">
                  {selectedDoc.title}
                </h5>
              </div>
            </div>

            {/* Conteúdo do Documento */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
              <div className="max-w-[880px] mx-auto w-full flex flex-col gap-8 pb-32">
                <div className="prose prose-sm max-w-none text-neutral-700">
                  <div className="text-body1 leading-relaxed font-medium markdown-content">
                    {renderMarkdown(selectedDoc.content)}
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-body2 font-bold text-neutral-900">Este artigo foi útil?</span>
                    <p className="text-small text-neutral-500">Sua opinião nos ajuda a melhorar.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant={userVoted === selectedDoc.id ? "primary" : "secondary"}
                      leftIcon="ph ph-thumbs-up"
                      className="!h-[34px] px-6"
                      onClick={() => handleDocVote(selectedDoc.id, 'useful')}
                      disabled={userVoted === selectedDoc.id}
                    >
                      Sim
                    </Button>
                    <Button
                      variant="secondary"
                      leftIcon="ph ph-thumbs-down"
                      className="!h-[34px] px-6"
                      onClick={() => handleDocVote(selectedDoc.id, 'not_useful')}
                      disabled={userVoted === selectedDoc.id}
                    >
                      Não
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full bg-white animate-in fade-in duration-300 overflow-hidden">
          {/* Header Interno de Busca */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-[12px_20px] lg:p-[12px_24px] border-b border-neutral-200 bg-white gap-4 min-h-[64px] lg:min-h-[72px] flex-none">
            <div className="flex flex-col gap-0.5">
              <h5 className="text-body1 font-bold text-neutral-black">Documentação</h5>
              <p className="text-body2 font-medium text-neutral-500">Tutoriais passo-a-passo sobre cada recurso.</p>
            </div>
            <TextInput
              placeholder="Pesquisar artigos..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              leftIcon="ph-magnifying-glass"
              containerClassName="w-full md:w-[280px]"
            />
          </div>

          {/* Seção de Conteúdo com Scroll e largura máxima */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
            <div className="max-w-[880px] mx-auto w-full flex flex-col gap-10 pb-20">
              {isLoadingDocs ? (
                <div className="flex-1 flex items-center justify-center p-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                    <span className="text-body2 font-bold text-neutral-400">Carregando documentação...</span>
                  </div>
                </div>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((category) => (
                  <div key={category.id} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                      <h6 className="text-body2 font-bold text-neutral-900 tracking-wider">{category.name}</h6>
                      <span className="text-tag font-bold text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full ml-auto">
                        {(category.doc_articles || []).length} {(category.doc_articles || []).length === 1 ? 'artigo' : 'artigos'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {(category.doc_articles || []).map((item, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedDoc({ ...item, category_name: category.name })}
                          className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary-500 hover:shadow-small transition-all group text-left w-full"
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors flex-none">
                              <i className="ph ph-file-text text-lg"></i>
                            </div>
                            <span className="text-body2 font-bold text-neutral-black truncate leading-tight transition-colors">
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-[11px] font-medium text-neutral-400 uppercase hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">Ler agora</span>
                            <i className="ph ph-caret-right text-neutral-300 group-hover:text-primary-500 flex-none"></i>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100">
                    <i className="ph ph-magnifying-glass text-3xl text-neutral-200"></i>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-body2 font-bold text-neutral-900">Nenhum resultado para "{docSearch}"</span>
                    <span className="text-body2 text-neutral-500">Tente usar palavras-chave mais simples ou categorias.</span>
                  </div>
                  <Button variant="tertiary" onClick={() => setDocSearch('')}>Limpar busca</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'videos') {
      if (selectedVideo) {
        return (
          <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden">
            {/* Header de Visualização do Vídeo */}
            <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] border-b border-neutral-200 bg-white gap-4 min-h-[64px] lg:min-h-[72px] flex-none">
              <button
                onClick={() => {
                  setSelectedVideo(null);
                  setIsPlaying(false);
                }}
                className="flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 transition-all shadow-small active:scale-95 flex-none"
              >
                <i className="ph ph-bold ph-arrow-left text-neutral-800 text-lg lg:text-xl"></i>
              </button>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-tag font-bold text-primary-500 tracking-widest">{selectedVideo.category_name}</span>
                </div>
                <h5 className="text-h5 font-bold text-neutral-black tracking-tight m-0 truncate">
                  {selectedVideo.title}
                </h5>
              </div>
            </div>

            {/* Conteúdo da Aula */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
              <div className="max-w-[1000px] mx-auto w-full flex flex-col gap-8 pb-32">
                {/* Video Player */}
                <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl relative flex items-center justify-center">
                  {!isPlaying ? (
                    <>
                      <img src={selectedVideo.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover opacity-60 blur-[1px]" />
                      <div
                        className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                        onClick={() => setIsPlaying(true)}
                      >
                        <i className="ph ph-fill ph-play-circle text-[100px] text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></i>
                      </div>
                    </>
                  ) : (
                    <iframe
                      src={getEmbedUrl(selectedVideo.video_url)}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <span>{selectedVideo.duration}</span>
                </div>
                <div className="prose prose-sm max-w-none text-neutral-700">
                  <h3 className="text-h4 font-bold text-neutral-black">Sobre este tutorial</h3>
                  <p className="text-body1 leading-relaxed font-medium">
                    {selectedVideo.description || `Nesta aula você aprenderá detalhadamente como utilizar todos os recursos da funcionalidade de ${selectedVideo.category_name || 'este módulo'}. Siga o passo-a-passo para garantir que sua conta Qrivo esteja configurada da melhor maneira possível.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full bg-white animate-in fade-in duration-300 overflow-hidden">
          {/* Header Interno de Vídeos */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-[12px_20px] lg:p-[12px_24px] border-b border-neutral-200 bg-white gap-4 min-h-[64px] lg:min-h-[72px] flex-none">
            <div className="flex flex-col gap-0.5">
              <h5 className="text-body1 font-bold text-neutral-black">Vídeos Tutoriais</h5>
              <p className="text-body2 font-medium text-neutral-500">Aprenda a dominar o Qrivo visualmente.</p>
            </div>
          </div>

          {isLoadingVideos ? (
            <div className="flex-1 flex items-center justify-center p-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                <span className="text-body2 font-bold text-neutral-400">Carregando tutoriais...</span>
              </div>
            </div>
          ) : (
            /* Conteúdo estilo Netflix com Scroll Vertical */
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <div className="flex flex-col gap-10 py-8 lg:py-10">
                {categories.map((category) => {
                  const videos = category.tutorial_videos || [];
                  if (videos.length === 0) return null;

                  return (
                    <div key={category.id} className="flex flex-col gap-4">
                      {/* Categoria Header */}
                      <div className="px-6 lg:px-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                          <h6 className="text-body2 font-bold text-neutral-900 tracking-wider font-inter">{category.name}</h6>
                        </div>
                        <div className="flex gap-2">
                          <button className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-all">
                            <i className="ph ph-caret-left"></i>
                          </button>
                          <button className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-all">
                            <i className="ph ph-caret-right"></i>
                          </button>
                        </div>
                      </div>

                      {/* Lista Horizontal */}
                      <div className="flex flex-row gap-4 overflow-x-auto no-scrollbar px-6 lg:px-10 pb-4">
                        {videos.map((video) => (
                          <div
                            key={video.id}
                            onClick={() => {
                              setSelectedVideo({ ...video, category_name: category.name });
                              setIsPlaying(false);
                            }}
                            className="flex flex-col gap-3 group cursor-pointer w-[280px] flex-none shrink-0"
                          >
                            <div className="aspect-video bg-neutral-100 rounded-xl border border-neutral-200 overflow-hidden relative shadow-cards">
                              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
                                <div className="w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-primary-600 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all">
                                  <i className="ph ph-fill ph-play text-xl"></i>
                                </div>
                              </div>
                              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded">
                                {video.duration}
                              </div>
                              <div className="absolute top-0 left-0 w-full h-full ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none"></div>
                            </div>
                            <div className="flex flex-col gap-0.5 px-1 pb-1">
                              <span className="text-body2 font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                                {video.title}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in duration-500 overflow-hidden">
      {/* Header Global - Padronizado com os demais módulos */}
      <header className="flex flex-col w-full bg-white flex-none border-b border-neutral-200">
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px] lg:min-h-[72px]">
          <div className="flex flex-col items-start p-0 gap-[1px] flex-1 overflow-hidden">
            <h1 className="text-h4 font-bold text-neutral-black tracking-tight m-0 truncate w-full">
              Central de Ajuda
            </h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0 truncate w-full">
              Como podemos ajudar você hoje? Explore nossos recursos de suporte.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white">
        {/* Sidebar Interno - Simplificado sem título redundante */}
        <div className="w-full lg:w-[240px] p-4 lg:p-8 bg-white border-b lg:border-b-0 lg:border-r border-neutral-100 flex-none flex flex-col items-center">
          <nav className="flex flex-col gap-1 w-full max-w-[240px] bg-neutral-50 p-1.5 rounded-2xl border border-neutral-100">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedDoc(null);
                    setSelectedVideo(null);
                  }}
                  className={`
                    flex items-center gap-3 px-4 h-[36px] rounded-xl transition-all whitespace-nowrap w-full group
                    ${isActive
                      ? 'bg-secondary-700 text-white shadow-small'
                      : 'text-neutral-black hover:bg-neutral-100'}
                  `}
                >
                  <i className={`ph ${isActive ? 'ph-fill' : 'ph-bold'} ${item.icon} text-lg transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-neutral-700'}`}></i>
                  <span className={`text-body2 truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-hidden bg-white">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
