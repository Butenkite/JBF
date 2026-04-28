export interface MasterBullet {
  id: string;
  text: string;
}

export interface MasterExperienceRole {
  title: string;
  roleId?: string;
  bullets: MasterBullet[];
}

export interface MasterSection {
  slug: string;
  title: string;
  skills: MasterBullet[];
  experienceRoles: MasterExperienceRole[];
  rawBodyLines: string[];
}

export interface MasterResume {
  sections: MasterSection[];
}
