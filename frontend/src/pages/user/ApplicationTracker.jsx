import { Calendar, ClipboardList, ExternalLink, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Card, CardContent, Select, Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '../../components/ui';
import { getUserApplications } from '../../api/applications';

/**
 * Application Tracker page
 * Track job applications with status and history
 */
const ApplicationTracker = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [summary, setSummary] = useState({
        total: 0,
        applied: 0,
        reviewing: 0,
        interview: 0,
        rejected: 0
    });

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const result = await getUserApplications();
                if (result.success) {
                    setApplications(result.applications || []);
                    if (result.summary) {
                        setSummary(result.summary);
                    }
                }
            } catch (error) {
                console.error('Error fetching applications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const statusOptions = [
        { value: 'all', label: 'All Applications' },
        { value: 'applied', label: 'Applied' }, // strict lower case matching from API
        { value: 'reviewing', label: 'Under Review' }, // API maps Shortlisted -> reviewing
        { value: 'interview', label: 'Interview' }, // API maps Interview/Offer -> interview
        { value: 'rejected', label: 'Rejected' },
    ];

    const filteredApplications = statusFilter === 'all'
        ? applications
        : applications.filter(app => {
            // Map frontend filter values to possible API status values
            if (statusFilter === 'reviewing') return ['Shortlisted', 'reviewing'].includes(app.status);
            if (statusFilter === 'interview') return ['Interview', 'interview', 'Offer', 'offer'].includes(app.status);
            return app.status.toLowerCase() === statusFilter.toLowerCase();
        });

    const getBadgeVariant = (status) => {
        const s = status.toLowerCase();
        if (s === 'applied') return 'primary';
        if (s === 'shortlisted' || s === 'reviewing') return 'info';
        if (s === 'interview' || s === 'offer') return 'warning';
        if (s === 'rejected') return 'error';
        return 'default';
    };

    if (loading) {
        return (
            <DashboardLayout type="user" title="Application Tracker">
                <div className="flex items-center justify-center h-64">
                    <div className="text-dark-400">Loading applications...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="user" title="Application Tracker">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-dark-100 mb-2">
                        Track Your Applications
                    </h2>
                    <p className="text-dark-400">
                        Monitor all your job applications in one place.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <Card padding="sm" className="text-center">
                        <CardContent>
                            <p className="text-2xl font-bold text-dark-100">{summary.total}</p>
                            <p className="text-xs text-dark-500">Total</p>
                        </CardContent>
                    </Card>
                    <Card padding="sm" className="text-center border-sky-500/30">
                        <CardContent>
                            <p className="text-2xl font-bold text-sky-400">{summary.applied}</p>
                            <p className="text-xs text-dark-500">Applied</p>
                        </CardContent>
                    </Card>
                    <Card padding="sm" className="text-center border-amber-500/30">
                        <CardContent>
                            <p className="text-2xl font-bold text-amber-400">{summary.reviewing}</p>
                            <p className="text-xs text-dark-500">Reviewing</p>
                        </CardContent>
                    </Card>
                    <Card padding="sm" className="text-center border-emerald-500/30">
                        <CardContent>
                            <p className="text-2xl font-bold text-emerald-400">{summary.interview}</p>
                            <p className="text-xs text-dark-500">Interview/Offer</p>
                        </CardContent>
                    </Card>
                    <Card padding="sm" className="text-center border-rose-500/30">
                        <CardContent>
                            <p className="text-2xl font-bold text-rose-400">{summary.rejected}</p>
                            <p className="text-xs text-dark-500">Rejected</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="flex items-center gap-4">
                        <Filter className="w-5 h-5 text-dark-400" />
                        <Select
                            options={statusOptions}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-48"
                        />
                        <div className="flex-1" />
                        <p className="text-sm text-dark-400">
                            Showing {filteredApplications.length} of {applications.length} applications
                        </p>
                    </CardContent>
                </Card>

                {/* Applications Table */}
                <Card>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Job</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Applied Date</TableHeader>
                                <TableHeader>Last Update</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredApplications.length > 0 ? (
                                filteredApplications.map((app, index) => (
                                    <TableRow
                                        key={app.application_id}
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {app.company_logo ? (
                                                    <img
                                                        src={app.company_logo}
                                                        alt={app.company_name}
                                                        className="w-10 h-10 rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-xs text-dark-400">
                                                        {app.company_name?.charAt(0) || 'C'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-dark-100">{app.job_title}</p>
                                                    <p className="text-sm text-dark-400">{app.company_name}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getBadgeVariant(app.status)} dot>
                                                {app.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-dark-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-dark-400">
                                                {app.last_update ? new Date(app.last_update).toLocaleDateString() : '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableEmpty
                                    colSpan={5}
                                    icon={ClipboardList}
                                    message="No applications found"
                                    description="Start applying to jobs to see them here"
                                />
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ApplicationTracker;
