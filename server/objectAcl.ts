import { File } from "@google-cloud/storage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

export enum ObjectAccessGroupType {
  ALL_AUTHENTICATED = "all_authenticated",
  EMAIL_LIST = "email_list",
}

export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }

  return granted === ObjectPermission.WRITE;
}

abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  public abstract hasMember(userId: string): Promise<boolean>;
}

class AllAuthenticatedAccessGroup extends BaseObjectAccessGroup {
  constructor() {
    super(ObjectAccessGroupType.ALL_AUTHENTICATED, "all");
  }

  public async hasMember(userId: string): Promise<boolean> {
    return !!userId;
  }
}

class EmailListAccessGroup extends BaseObjectAccessGroup {
  constructor(emailList: string) {
    super(ObjectAccessGroupType.EMAIL_LIST, emailList);
  }

  public async hasMember(userEmail: string): Promise<boolean> {
    if (!this.id || this.id.trim() === "") {
      return false;
    }
    
    const emails = this.id.split(",")
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0 && e.includes("@"));
    
    if (emails.length === 0) {
      return false;
    }
    
    return emails.includes(userEmail.toLowerCase());
  }
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    case ObjectAccessGroupType.ALL_AUTHENTICATED:
      return new AllAuthenticatedAccessGroup();
    case ObjectAccessGroupType.EMAIL_LIST:
      return new EmailListAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

export async function canAccessObject({
  userId,
  userEmail,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  userEmail?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  if (!userId) {
    return false;
  }

  if (aclPolicy.owner === userId) {
    return true;
  }

  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    const identifier = accessGroup.type === ObjectAccessGroupType.EMAIL_LIST ? (userEmail || userId) : userId;
    if (
      (await accessGroup.hasMember(identifier)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}
