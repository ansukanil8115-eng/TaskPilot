from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanAccessTask(BasePermission):
    """
    Admin: full access
    Manager: CRUD + assign to interns
    Intern: read assigned + update status only
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, "role", None)

        if role == "ADMIN":
            return True

        if role == "MANAGER":
            return True

        # Interns: only their assigned tasks
        if role == "INTERN":
            if obj.assigned_to_id != user.id:
                return False
            if request.method in SAFE_METHODS:
                return True
            # update allowed (serializer further restricts fields)
            return request.method in {"PUT", "PATCH"}

        return False

