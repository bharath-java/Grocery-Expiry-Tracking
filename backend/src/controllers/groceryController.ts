import { Response } from 'express';
import { AuthRequest } from '../types';
import Grocery from '../models/Grocery';
import { uploadImage } from '../middleware/upload';
import { sendSuccess, sendError } from '../utils/responses';

export const calculateStatus = (expiryDate: Date): 'Expired' | 'Expiring Soon' | 'Fresh' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays <= 4) { // Up to 4 days matches "Yogurt (in 4 days)" in the Expiring Soon UI screen.
    return 'Expiring Soon';
  } else {
    return 'Fresh';
  }
};

const notifySocketUpdate = (req: AuthRequest) => {
  const io = req.app.get('io');
  if (io && req.user) {
    io.to(req.user.id).emit('groceryUpdate', { userId: req.user.id });
  }
};

export const createGrocery = async (req: AuthRequest, res: Response) => {
  try {
    const { itemName, category, quantity, purchaseDate, expiryDate, notes, brand, image } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User identity not found', 401);
    }

    let imageUrl = image || '';
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    }

    const expDate = new Date(expiryDate);
    const status = calculateStatus(expDate);

    const grocery = await Grocery.create({
      userId,
      itemName,
      category,
      quantity,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      expiryDate: expDate,
      image: imageUrl,
      notes: notes || '',
      brand: brand || '',
      status,
      archived: false
    });

    notifySocketUpdate(req);

    return sendSuccess(res, grocery, 'Grocery added successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const getGroceries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'User identity not found', 401);
    }

    const { 
      category, 
      status, 
      search, 
      sortBy = 'expiryDate', 
      order = 'asc', 
      page = '1', 
      limit = '100',
      archived = 'false'
    } = req.query;

    const query: any = { userId, archived: archived === 'true' };

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.itemName = { $regex: search, $options: 'i' };
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = order === 'desc' ? -1 : 1;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // First, verify & update status of all items in database dynamically in case they expired today
    const groceriesToUpdate = await Grocery.find({ userId, archived: false });
    for (const item of groceriesToUpdate) {
      const currentStatus = calculateStatus(item.expiryDate);
      if (item.status !== currentStatus) {
        item.status = currentStatus;
        await item.save();
      }
    }

    const groceries = await Grocery.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Grocery.countDocuments(query);

    return sendSuccess(res, {
      groceries,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum)
    }, 'Groceries fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const updateGrocery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = { ...req.body };

    const grocery = await Grocery.findOne({ _id: id, userId });
    if (!grocery) {
      return sendError(res, 'Grocery item not found or unauthorized', 404);
    }

    if (req.file) {
      updates.image = await uploadImage(req.file);
    }

    if (updates.expiryDate) {
      const expDate = new Date(updates.expiryDate);
      updates.status = calculateStatus(expDate);
    }

    const updatedGrocery = await Grocery.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    notifySocketUpdate(req);

    return sendSuccess(res, updatedGrocery, 'Grocery updated successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const deleteGrocery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const grocery = await Grocery.findOneAndDelete({ _id: id, userId });
    if (!grocery) {
      return sendError(res, 'Grocery item not found or unauthorized', 404);
    }

    notifySocketUpdate(req);

    return sendSuccess(res, null, 'Grocery item deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const archiveGrocery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const grocery = await Grocery.findOneAndUpdate(
      { _id: id, userId },
      { $set: { archived: true } },
      { new: true }
    );

    if (!grocery) {
      return sendError(res, 'Grocery item not found or unauthorized', 404);
    }

    notifySocketUpdate(req);

    return sendSuccess(res, grocery, 'Grocery item archived successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const restoreGrocery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const grocery = await Grocery.findOneAndUpdate(
      { _id: id, userId },
      { $set: { archived: false } },
      { new: true }
    );

    if (!grocery) {
      return sendError(res, 'Grocery item not found or unauthorized', 404);
    }

    notifySocketUpdate(req);

    return sendSuccess(res, grocery, 'Grocery item restored successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

export const uploadImageEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file uploaded', 400);
    }
    const imageUrl = await uploadImage(req.file);
    return sendSuccess(res, { imageUrl }, 'Image uploaded successfully');
  } catch (error: any) {
    return sendError(res, error.message);
  }
};
