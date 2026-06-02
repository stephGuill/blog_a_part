import "./ActivityList.css";

function ActivityList({ activities = [] }) {
  return (
    <ul className="activity-list">
      {activities.map((activity) => (
        <li key={activity.id}>{activity.label}</li>
      ))}
    </ul>
  );
}

export default ActivityList;
