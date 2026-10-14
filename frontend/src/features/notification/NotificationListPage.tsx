import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/notification.service';
import { statusOf } from '../../api/http';
import type { Notification } from '../../api/types';
import { dateShort } from '../../shared/filters';
import { ErrorBanner, LoadingIndicator } from '../../shared/Feedback';

/** React port of `NotificationListController` + `notification-list.html`. */
export function NotificationListPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await NotificationService.getAll()).data,
  });

  const sendTestMutation = useMutation({
    mutationFn: () => NotificationService.sendTest(),
    onSuccess: (response) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (current) => [
        response.data,
        ...(current ?? []),
      ]);
    },
  });

  const loading = query.isPending;
  const notifications = query.data ?? [];
  const error = query.isError
    ? `Failed to load notifications (status ${statusOf(query.error)})`
    : null;

  return (
    <>
      <h2>Notifications</h2>

      <button
        className="btn btn-primary"
        onClick={() => sendTestMutation.mutate()}
        style={{ marginBottom: '16px' }}
      >
        Send Test Notification
      </button>

      {loading && <LoadingIndicator noun="notifications" />}
      <ErrorBanner message={error} />

      {!loading && (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Sent Date</th>
              <th>Channel</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Successful</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <tr key={notification.id}>
                <td>{dateShort(notification.sentDate)}</td>
                <td>{notification.channel}</td>
                <td>{notification.recipient}</td>
                <td>{notification.subject}</td>
                <td>
                  {notification.successful ? (
                    <span className="label label-success">Yes</span>
                  ) : (
                    <span className="label label-danger">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
