import { toggleReaction } from "../services/messageService";

const ReactionBar = ({
  message,
  currentUserId,
  onReactionUpdate,
}) => {
  const reactions = message.reactions || [];

  if (reactions.length === 0) {
    return null;
  }

  const grouped = reactions.reduce(
    (acc, reaction) => {
      const emoji = reaction.emoji;

      if (!acc[emoji]) {
        acc[emoji] = {
          emoji,
          count: 0,
          reactedByMe: false,
        };
      }

      acc[emoji].count += 1;

      const reactionUserId =
        reaction.user?._id ?? reaction.user;

      if (
        reactionUserId?.toString() ===
        currentUserId?.toString()
      ) {
        acc[emoji].reactedByMe = true;
      }

      return acc;
    },
    {}
  );

  const handleToggle = async (emoji) => {
    try {
      const updated = await toggleReaction(
        message._id,
        emoji
      );

      onReactionUpdate(updated);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="reaction-bar">
      {Object.values(grouped).map((group) => (
        <button
          key={group.emoji}
          type="button"
          className={`reaction-chip ${
            group.reactedByMe ? "active" : ""
          }`}
          onClick={() =>
            handleToggle(group.emoji)
          }
        >
          {group.emoji} {group.count}
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;
