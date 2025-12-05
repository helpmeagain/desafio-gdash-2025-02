import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { User, UserDocument } from "./schemas/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      email: createUserDto.email.toLowerCase(),
    });

    return createdUser.save();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const lowercasedEmail = email.toLowerCase();
    return await this.userModel.findOne({ email: lowercasedEmail }).exec();
  }

  async findOneById(id: string): Promise<User | null> {
    return await this.userModel.findOne({ _id: id }).exec();
  }

  async findOneByIdWithRefreshHash(id: string): Promise<User | null> {
    return await this.userModel
      .findOne({ _id: id })
      .select("+refreshTokenHash")
      .exec();
  }

  async findAllPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).select("-password").exec(),
      this.userModel.countDocuments(),
    ]);

    return {
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
      data: items,
    };
  }

  async update(id: string, updateDto: UpdateUserDto) {
    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    const updated = await this.userModel.findByIdAndUpdate(id, updateDto, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw new NotFoundException("Usuário não encontrado");
    }

    return updated;
  }

  async remove(id: string) {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException("Usuário não encontrado");
    }

    return { message: "Usuário removido com sucesso" };
  }

  async setRefreshTokenHash(
    userId: string,
    refreshTokenHash: string
  ): Promise<void> {
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException("Usuário não encontrado");
    }
  }

  async removeRefreshTokenHash(userId: string): Promise<void> {
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $unset: { refreshTokenHash: 1 } },
        { new: true }
      )
      .exec();

    if (!updated) {
      throw new NotFoundException("Usuário não encontrado");
    }
  }
}
