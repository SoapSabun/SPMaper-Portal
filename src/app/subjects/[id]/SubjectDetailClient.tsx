'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Subject, PaperWithUrl } from '@/lib/api';
import styles from './subject.module.css';

const STATE_ABBR: Record<string, string> = {
  'SBP': 'SBP',
  'MRSM': 'MRSM',
  'Johor': 'JHR',
  'Kedah': 'KDH',
  'Kelantan': 'KTN',
  'Melaka': 'MLK',
  'Negeri Sembilan': 'N9',
  'Pahang': 'PHG',
  'Perak': 'PRK',
  'Perlis': 'PLS',
  'Pulau Pinang': 'PNG',
  'Sabah': 'SBH',
  'Sarawak': 'SWK',
  'Selangor': 'SGR',
  'Terengganu': 'TRG',
  'W.P. Kuala Lumpur': 'KL',
  'W.P. Labuan': 'LBN',
  'W.P. Putrajaya': 'PJ',
};

function getStateAbbr(negeri: string): string {
  if (STATE_ABBR[negeri]) return STATE_ABBR[negeri];
  const cleaned = negeri.replace(/[^a-zA-Z0-9]/g, '');
  return cleaned.slice(0, 3).toUpperCase() || 'SPM';
}

function getDownloadUrl(url: string): string {
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && url.includes('drive.google.com')) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  if (url.includes('supabase.co')) {
    return `${url}?download=`;
  }
  return url;
}

function getDownloadHref(publicUrl: string, title: string): string {
  return `/api/download?url=${encodeURIComponent(publicUrl)}&name=${encodeURIComponent(title)}`;
}

interface ExamPack {
  key: string;
  year: number;
  negeri: string;
  k1: { soalan?: PaperWithUrl; skema?: PaperWithUrl };
  k2: { soalan?: PaperWithUrl; skema?: PaperWithUrl };
  k3: { soalan?: PaperWithUrl; skema?: PaperWithUrl };
  others: PaperWithUrl[];
  totalCount: number;
}

export default function SubjectDetailClient({
  subject,
  papers,
}: {
  subject: Subject;
  papers: PaperWithUrl[];
}) {
  const [isPending, startTransition] = useTransition();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedNegeri, setSelectedNegeri] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'soalan' | 'skema'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 8 exam packs per page (~20-30 individual papers)

  const handleOpenPaper = (id: string) => {
    setOpeningId(id);
    setTimeout(() => {
      setOpeningId(null);
    }, 2000);
  };

  // Extract unique available years and states
  const uniqueYears = Array.from(new Set(papers.map((p) => p.year?.toString() || '')))
    .filter(Boolean)
    .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  const years = ['All', ...uniqueYears];

  const uniqueNegeris = Array.from(new Set(papers.map((p) => p.negeri || '')))
    .filter(Boolean)
    .sort();
  const negeris = ['All', ...uniqueNegeris];

  // 1. Filter papers based on user selections
  const filteredPapers = papers.filter((p) => {
    // Year filter
    if (selectedYear !== 'All' && p.year?.toString() !== selectedYear) return false;

    // State filter
    if (selectedNegeri !== 'All' && p.negeri !== selectedNegeri) return false;

    // Type filter (All vs Questions only vs Schemes only)
    const isSkema =
      p.paper_type?.toLowerCase().includes('skema') ||
      p.title?.toLowerCase().includes('skema') ||
      p.title?.toLowerCase().includes('jawapan');

    if (typeFilter === 'soalan' && isSkema) return false;
    if (typeFilter === 'skema' && !isSkema) return false;

    // Search query (state, title, paper type)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchState = p.negeri?.toLowerCase().includes(q);
      const matchType = p.paper_type?.toLowerCase().includes(q);
      if (!matchTitle && !matchState && !matchType) return false;
    }

    return true;
  });

  // 2. Group filtered papers into structured Exam Packs (by Year + Negeri)
  const packMap = new Map<string, ExamPack>();

  for (const paper of filteredPapers) {
    const packKey = `${paper.year}_${paper.negeri || 'Unknown'}`;

    if (!packMap.has(packKey)) {
      packMap.set(packKey, {
        key: packKey,
        year: paper.year,
        negeri: paper.negeri || 'Umum',
        k1: {},
        k2: {},
        k3: {},
        others: [],
        totalCount: 0,
      });
    }

    const pack = packMap.get(packKey)!;
    pack.totalCount++;

    const lowerType = (paper.paper_type || '').toLowerCase();
    const lowerTitle = (paper.title || '').toLowerCase();
    const isSkema = lowerType.includes('skema') || lowerTitle.includes('skema') || lowerTitle.includes('jawapan');

    const isK1 = lowerType.includes('kertas 1') || lowerType.includes('k1') || lowerTitle.includes('k1') || lowerTitle.includes('kertas 1');
    const isK2 = lowerType.includes('kertas 2') || lowerType.includes('k2') || lowerTitle.includes('k2') || lowerTitle.includes('kertas 2');
    const isK3 = lowerType.includes('kertas 3') || lowerType.includes('k3') || lowerTitle.includes('k3') || lowerTitle.includes('kertas 3');

    if (isK1) {
      if (isSkema) pack.k1.skema = paper;
      else pack.k1.soalan = paper;
    } else if (isK2) {
      if (isSkema) pack.k2.skema = paper;
      else pack.k2.soalan = paper;
    } else if (isK3) {
      if (isSkema) pack.k3.skema = paper;
      else pack.k3.soalan = paper;
    } else {
      pack.others.push(paper);
    }
  }

  // Sort packs by Year (descending), then by State name alphabetically
  const examPacks = Array.from(packMap.values()).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.negeri.localeCompare(b.negeri);
  });

  // Pagination for packs
  const totalPages = Math.ceil(examPacks.length / itemsPerPage);
  const paginatedPacks = examPacks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers that reset pagination with smooth transition
  const handleYearChange = (year: string) => {
    startTransition(() => {
      setSelectedYear(year);
      setCurrentPage(1);
    });
  };

  const handleNegeriChange = (negeri: string) => {
    startTransition(() => {
      setSelectedNegeri(negeri);
      setCurrentPage(1);
    });
  };

  const handleTypeChange = (type: 'all' | 'soalan' | 'skema') => {
    startTransition(() => {
      setTypeFilter(type);
      setCurrentPage(1);
    });
  };

  const handleResetFilters = () => {
    startTransition(() => {
      setSearchQuery('');
      setSelectedYear('All');
      setSelectedNegeri('All');
      setTypeFilter('all');
      setCurrentPage(1);
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedYear !== 'All' ||
    selectedNegeri !== 'All' ||
    typeFilter !== 'all';

  return (
    <>
      <div className={styles.navigation}>
        <Link href="/" className={styles.backLink}>
          ← Kembali ke Senarai Subjek
        </Link>
      </div>

      <header className={styles.header}>
        <div className={styles.subjectIconLarge}>
          {subject.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.titleWrapper}>
          <h1>{subject.name}</h1>
          <div className={styles.badgeRow}>
            {subject.code && <span className={styles.codeBadge}>{subject.code}</span>}
            <span className={styles.paperCountBadge}>
              {papers.length} {papers.length === 1 ? 'Kertas' : 'Kertas Terkumpul'}
            </span>
          </div>
        </div>
      </header>

      {/* ====================================================== */}
      {/* Streamlined Filter Bar                                 */}
      {/* ====================================================== */}
      <section className={styles.filterBar}>
        {/* Progress indicator when filtering */}
        {isPending && (
          <div className={styles.filterProgress}>
            <div className={styles.filterProgressBar} />
          </div>
        )}

        {/* Search input + State dropdown */}
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Cari negeri, sekolah, kertas (cth: SBP, MRSM, Kertas 2)..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                startTransition(() => {
                  setSearchQuery(val);
                  setCurrentPage(1);
                });
              }}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  });
                }}
                className={styles.clearSearchBtn}
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedNegeri}
            onChange={(e) => handleNegeriChange(e.target.value)}
            className={styles.stateSelect}
          >
            <option value="All">Semua Negeri ({negeris.length > 1 ? negeris.length - 1 : 0})</option>
            {uniqueNegeris.map((neg) => (
              <option key={neg} value={neg}>
                {neg}
              </option>
            ))}
          </select>
        </div>

        {/* Swipeable Year Strip */}
        <div className={styles.yearRow}>
          <span className={styles.filterLabel}>Tahun:</span>
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handleYearChange(year)}
              className={`${styles.yearBtn} ${selectedYear === year ? styles.yearBtnActive : ''}`}
            >
              {year === 'All' ? 'Semua' : year}
            </button>
          ))}
        </div>

        {/* Sub-filters: Type switch & active count */}
        <div className={styles.subFilterRow}>
          <div className={styles.typeToggle}>
            <button
              type="button"
              onClick={() => handleTypeChange('all')}
              className={`${styles.typeBtn} ${typeFilter === 'all' ? styles.typeBtnActive : ''}`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('soalan')}
              className={`${styles.typeBtn} ${typeFilter === 'soalan' ? styles.typeBtnActive : ''}`}
            >
              Soalan Sahaja
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('skema')}
              className={`${styles.typeBtn} ${typeFilter === 'skema' ? styles.typeBtnActive : ''}`}
            >
              Skema Sahaja
            </button>
          </div>

          <div className={styles.filterSummary}>
            <span>
              Menunjukkan <strong>{examPacks.length}</strong> Pek Peperiksaan ({filteredPapers.length} fail)
            </span>
            {hasActiveFilters && (
              <button type="button" onClick={handleResetFilters} className={styles.resetBtn}>
                Set Semula
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* Exam Packs Grid                                        */}
      {/* ====================================================== */}
      <section>
        {paginatedPacks.length > 0 ? (
          <div className={`${styles.packsGrid} ${isPending ? styles.packsGridPending : ''}`}>
            {paginatedPacks.map((pack) => (
              <article key={pack.key} className={styles.packCard}>
                {/* Pack Card Header */}
                <header className={styles.packHeader}>
                  <div className={styles.packHeaderLeft}>
                    <div className={styles.stateIcon}>{getStateAbbr(pack.negeri)}</div>
                    <div>
                      <h2 className={styles.packTitle}>{pack.negeri}</h2>
                      <div className={styles.packMeta}>
                        Percubaan SPM • {pack.totalCount} {pack.totalCount === 1 ? 'Fail' : 'Fail Disediakan'}
                      </div>
                    </div>
                  </div>
                  <span className={styles.yearTag}>{pack.year}</span>
                </header>

                {/* Pack Card Body: Structured Slot Rows */}
                <div className={styles.packBody}>
                  {/* Kertas 1 Slot */}
                  {(pack.k1.soalan || pack.k1.skema) && (
                    <div className={styles.slotBox}>
                      <div className={styles.slotInfo}>
                        <span className={styles.slotTitle}>Kertas 1</span>
                        <span className={styles.slotSubtitle}>Soalan Objektif</span>
                      </div>
                      <div className={styles.slotActions}>
                        {pack.k1.soalan && (
                          <div className={styles.btnGroup}>
                            <a
                              href={pack.k1.soalan.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.btnAction} ${styles.btnSoalan} ${openingId === pack.k1.soalan.id ? styles.btnLoading : ''}`}
                              onClick={() => handleOpenPaper(pack.k1.soalan!.id)}
                              title="Buka & Baca Kertas Soalan 1"
                            >
                              {openingId === pack.k1.soalan.id ? (
                                <>
                                  <svg className="spinner" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                  </svg>
                                  Membuka...
                                </>
                              ) : (
                                <>👁️ Soalan</>
                              )}
                            </a>
                            <a
                              href={getDownloadHref(pack.k1.soalan.publicUrl, pack.k1.soalan.title)}
                              className={`${styles.btnAction} ${styles.btnDownload}`}
                              title="Muat Turun Soalan 1 ke Peranti"
                              download
                            >
                              📥
                            </a>
                          </div>
                        )}
                        {pack.k1.skema && (
                          <div className={styles.btnGroup}>
                            <a
                              href={pack.k1.skema.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.btnAction} ${styles.btnSkema} ${openingId === pack.k1.skema.id ? styles.btnLoading : ''}`}
                              onClick={() => handleOpenPaper(pack.k1.skema!.id)}
                              title="Buka & Baca Skema Jawapan 1"
                            >
                              {openingId === pack.k1.skema.id ? (
                                <>
                                  <svg className="spinner" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                  </svg>
                                  Membuka...
                                </>
                              ) : (
                                <>📋 Skema</>
                              )}
                            </a>
                            <a
                              href={getDownloadHref(pack.k1.skema.publicUrl, pack.k1.skema.title)}
                              className={`${styles.btnAction} ${styles.btnDownload}`}
                              title="Muat Turun Skema 1 ke Peranti"
                              download
                            >
                              📥
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Kertas 2 Slot */}
                  {(pack.k2.soalan || pack.k2.skema) && (
                    <div className={styles.slotBox}>
                      <div className={styles.slotInfo}>
                        <span className={styles.slotTitle}>Kertas 2</span>
                        <span className={styles.slotSubtitle}>Subjektif Bahagian A & B</span>
                      </div>
                      <div className={styles.slotActions}>
                        {pack.k2.soalan && (
                          <div className={styles.btnGroup}>
                            <a
                              href={pack.k2.soalan.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.btnAction} ${styles.btnSoalan} ${openingId === pack.k2.soalan.id ? styles.btnLoading : ''}`}
                              onClick={() => handleOpenPaper(pack.k2.soalan!.id)}
                              title="Buka & Baca Kertas Soalan 2"
                            >
                              {openingId === pack.k2.soalan.id ? (
                                <>
                                  <svg className="spinner" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                  </svg>
                                  Membuka...
                                </>
                              ) : (
                                <>👁️ Soalan</>
                              )}
                            </a>
                            <a
                              href={getDownloadHref(pack.k2.soalan.publicUrl, pack.k2.soalan.title)}
                              className={`${styles.btnAction} ${styles.btnDownload}`}
                              title="Muat Turun Soalan 2 ke Peranti"
                              download
                            >
                              📥
                            </a>
                          </div>
                        )}
                        {pack.k2.skema && (
                          <div className={styles.btnGroup}>
                            <a
                              href={pack.k2.skema.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.btnAction} ${styles.btnSkema} ${openingId === pack.k2.skema.id ? styles.btnLoading : ''}`}
                              onClick={() => handleOpenPaper(pack.k2.skema!.id)}
                              title="Buka & Baca Skema Jawapan 2"
                            >
                              {openingId === pack.k2.skema.id ? (
                                <>
                                  <svg className="spinner" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                  </svg>
                                  Membuka...
                                </>
                              ) : (
                                <>📋 Skema</>
                              )}
                            </a>
                            <a
                              href={getDownloadHref(pack.k2.skema.publicUrl, pack.k2.skema.title)}
                              className={`${styles.btnAction} ${styles.btnDownload}`}
                              title="Muat Turun Skema 2 ke Peranti"
                              download
                            >
                              📥
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Kertas 3 Slot */}
                  {(pack.k3.soalan || pack.k3.skema) && (
                    <div className={styles.slotBox}>
                      <div className={styles.slotInfo}>
                        <span className={styles.slotTitle}>Kertas 3</span>
                        <span className={styles.slotSubtitle}>Amali / Lisan</span>
                      </div>
                      <div className={styles.slotActions}>
                        {pack.k3.soalan && (
                          <div className={styles.btnGroup}>
                            <a
                              href={pack.k3.soalan.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.btnAction} ${styles.btnSoalan} ${openingId === pack.k3.soalan.id ? styles.btnLoading : ''}`}
                              onClick={() => handleOpenPaper(pack.k3.soalan!.id)}
                              title="Buka & Baca Kertas Soalan 3"
                            >
                              {openingId === pack.k3.soalan.id ? (
                                <>
                                  <svg className="spinner" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                  </svg>
                                  Membuka...
                                </>
                              ) : (
                                <>👁️ Soalan</>
                              )}
                            </a>
                            <a
                              href={getDownloadHref(pack.k3.soalan.publicUrl, pack.k3.soalan.title)}
                              className={`${styles.btnAction} ${styles.btnDownload}`}
                              title="Muat Turun Soalan 3 ke Peranti"
                              download
                            >
                              📥
                            </a>
                          </div>
                        )}
                        {pack.k3.skema && (
                          <div className={styles.btnGroup}>
                            <a
                              href={pack.k3.skema.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.btnAction} ${styles.btnSkema} ${openingId === pack.k3.skema.id ? styles.btnLoading : ''}`}
                              onClick={() => handleOpenPaper(pack.k3.skema!.id)}
                              title="Buka & Baca Skema Jawapan 3"
                            >
                              {openingId === pack.k3.skema.id ? (
                                <>
                                  <svg className="spinner" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                  </svg>
                                  Membuka...
                                </>
                              ) : (
                                <>📋 Skema</>
                              )}
                            </a>
                            <a
                              href={getDownloadHref(pack.k3.skema.publicUrl, pack.k3.skema.title)}
                              className={`${styles.btnAction} ${styles.btnDownload}`}
                              title="Muat Turun Skema 3 ke Peranti"
                              download
                            >
                              📥
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional or Custom Named Papers */}
                  {pack.others.map((otherPaper) => (
                    <div key={otherPaper.id} className={styles.slotBox}>
                      <div className={styles.slotInfo}>
                        <span className={styles.slotTitle}>{otherPaper.title}</span>
                        <span className={styles.slotSubtitle}>{otherPaper.paper_type || 'Kertas Tambahan'}</span>
                      </div>
                      <div className={styles.slotActions}>
                        <div className={styles.btnGroup}>
                          <a
                            href={otherPaper.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.btnAction} ${styles.btnSoalan} ${openingId === otherPaper.id ? styles.btnLoading : ''}`}
                            onClick={() => handleOpenPaper(otherPaper.id)}
                            title="Buka & Baca Fail"
                          >
                            {openingId === otherPaper.id ? 'Membuka...' : '👁️ Lihat'}
                          </a>
                          <a
                            href={getDownloadHref(otherPaper.publicUrl, otherPaper.title)}
                            className={`${styles.btnAction} ${styles.btnDownload}`}
                            title="Muat Turun Fail ke Peranti"
                            download
                          >
                            📥
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>Tiada Pek Peperiksaan Dijumpai</h3>
            <p>
              {hasActiveFilters
                ? 'Tiada kertas yang sepadan dengan carian atau penapis anda. Cuba set semula penapis.'
                : 'Belum ada kertas peperiksaan yang dimuat naik untuk subjek ini.'}
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={handleResetFilters} className={styles.pageBtn}>
                Set Semula Penapis
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className={styles.pageBtn}
            >
              ← Sebelum
            </button>
            <span className={styles.pageInfo}>
              Halaman {currentPage} daripada {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className={styles.pageBtn}
            >
              Seterusnya →
            </button>
          </div>
        )}
      </section>
    </>
  );
}
