import { Calendar, ClipboardList, ExternalLink, Filter } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Badge, Button, Card, CardContent, Select, Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '../../components/ui';
import { applications, getApplicationStats, statusConfig } from '../../mockData/applications';

/**
 * Application Tracker page
 * Track job applications with status and history
 */
const ApplicationTracker = () => {
    const [statusFilter, setStatusFilter] = useState('all');
    const stats = getApplicationStats();

    const statusOptions = [
        { value: 'all', label: 'All Applications' },
        { value: 'applied', label: 'Applied' },
        { value: 'reviewing', label: 'Under Review' },
        { value: 'interview', label: 'Interview' },
        { value: 'offer', label: 'Offer' },
        { value: 'rejected', label: 'Rejected' },
    ];

    const filteredApplications = statusFilter === 'all'
        ? applications
        : applications.filter(app => app.status === statusFilter);

    const getBadgeVariant = (status) => {
        return statusConfig[status]?.color || 'default';
    };

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
                            <p className="text-2xl font-bold text-dark-100">{stats.total}</p>
                            <p className="text-xs text-dark-500">Total</p>
                        </CardContent>
                    </Card>
                    <Card padding="sm" className="text-center border-sky-500/30">
                        <CardContent>
                            <p className="text-2xl font-bold text-sky-400">{stats.applied}</p>
                            <p className="text-xs text-dark-500">Applied</p>
                        </CardContent>
                    </Card>
                    <Card padding="sm" className="text-center border-amber-500/30">
                        <CardContent>
                            <p className="text-2xl font-bold text-amber-400">{stats.reviewing}</p>
                            <p className="text-xs text-dark-500">Reviewing</p>
                        </CardContent>
                    </Card>
                    <Card padding="sm" className="text-center border-emerald-500/30">
                        <CardContent>
                            <p className="text-2xl font-bold text-emerald-400">{stats.interview + stats.offer}</p>
                            <p className="text-xs text-dark-500">Interview/Offer</p>
                        </CardContent>
                    </Card>
                    <Card padding="sm" className="text-center border-rose-500/30">
                        <CardContent>
                            <p className="text-2xl font-bold text-rose-400">{stats.rejected}</p>
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
                                        key={app.id}
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={app.companyLogo}
                                                    alt={app.company}
                                                    className="w-10 h-10 rounded-lg"
                                                />
                                                <div>
                                                    <p className="font-medium text-dark-100">{app.jobTitle}</p>
                                                    <p className="text-sm text-dark-400">{app.company}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getBadgeVariant(app.status)} dot>
                                                {statusConfig[app.status]?.label || app.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-dark-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>{app.appliedDate}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-dark-400">{app.lastUpdate}</span>
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
