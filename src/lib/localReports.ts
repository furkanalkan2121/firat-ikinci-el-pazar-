/**
 * localReports.ts
 * İlan şikayet ve bildirimlerini localStorage üzerinde yöneten altyapı.
 */

export type ReportReason =
  | 'Yanıltıcı / Yanlış Bilgi'
  | 'Uygunsuz / Sakıncalı İçerik'
  | 'Dolandırıcılık Şüphesi'
  | 'Fiyat / İletişim Hatası'
  | 'Diğer';

export type Report = {
  id: string;
  listingId: string;
  listingTitle: string;
  reporterId: string;
  reporterEmail: string;
  reason: ReportReason;
  details?: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
};

const REPORTS_KEY = 'fu_reports';

export function getReports(): Report[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addReport(report: Omit<Report, 'id' | 'createdAt' | 'status'>): Report {
  const reports = getReports();
  const newReport: Report = {
    ...report,
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  reports.unshift(newReport);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  return newReport;
}

/** Bir kullanıcının açtığı tüm şikayetleri sil (hesap silme için). */
export function deleteUserReports(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  const reports = getReports().filter(r => r.reporterId !== userId);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export function updateReportStatus(reportId: string, status: 'resolved' | 'dismissed'): void {
  const reports = getReports();
  const index = reports.findIndex(r => r.id === reportId);
  if (index !== -1) {
    reports[index].status = status;
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
}
